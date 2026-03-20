const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

exports.generateQuizWithLLM = async (req, res) => {
    try {
        const {
            course,
            questionType, // e.g., 'MCQ', 'Essay', 'Structured'
            numberOfQuestions,
            marksPerQuestion
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded. Please upload the module PDF.' });
        }

        if (req.file.mimetype !== 'application/pdf' && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
            return res.status(400).json({ message: 'Invalid file format. Only PDF files are supported for AI question generation.' });
        }

        // Parse PDF text
        let pdfData;
        try {
            pdfData = await pdfParse(req.file.buffer);
        } catch (error) {
            console.error("PDF Parsing Error:", error);
            return res.status(400).json({ message: 'Error reading the PDF. Please ensure the file is a valid PDF.' });
        }
        
        const pdfText = pdfData.text;

        if (!pdfText || pdfText.trim().length === 0) {
            return res.status(400).json({ message: 'Could not extract text from the provided PDF.' });
        }

        // Initialize Gemini API
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is not configured in the server.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Construct the prompt
        const prompt = `
You are an expert educator. I need you to generate a quiz based on the provided course material text.
Course Material Text:
"""
${pdfText.substring(0, 30000)} 
"""

Requirements:
- Number of questions: ${numberOfQuestions}
- Question Type: ${questionType} (MCQ, Essay, or Structured)
- Difficulty should be appropriate for university level.
${questionType === 'MCQ' ? '- For each MCQ, provide 4 options and clearly indicate the correct answer.' : ''}

Output ONLY valid JSON in the following format (no markdown code blocks, just raw JSON array of objects):
[
  {
    "questionText": "Question 1 text...",
    "type": "${questionType}",
    ${questionType === 'MCQ' ? '"options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": "Option A"' : '"correctAnswer": "Outline of expected answer or grading criteria"'}
  }
]
    `;

        // Add truncation to avoid massive token usage, roughly 30k characters is safe for 2.5 flash.

        // Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const responseText = response.text;

        let generatedQuestions;
        try {
            generatedQuestions = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse LLM JSON response:", responseText);
            return res.status(500).json({ message: 'Failed to generate a valid quiz. Try again.' });
        }

        // Add marks to each generated question
        const questionsWithMarks = generatedQuestions.map(q => ({
            ...q,
            marks: parseInt(marksPerQuestion) || 1
        }));

        res.status(200).json({
            message: 'Questions generated successfully',
            questions: questionsWithMarks
        });

    } catch (err) {
        console.error("Error generating quiz via LLM:", err);
        res.status(500).json({ message: err.message || 'Server error generating quiz' });
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { title, course, description, dueDate, teacherId, questions } = req.body;

        if (!teacherId) {
            return res.status(400).json({ message: 'Teacher ID is required' });
        }

        const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

        const quiz = new Quiz({
            title,
            course,
            description,
            dueDate,
            teacher: teacherId,
            questions,
            totalMarks
        });

        await quiz.save();
        res.status(201).json({ message: 'Quiz published successfully', quiz });
    } catch (err) {
        console.error("Error creating quiz:", err);
        res.status(500).json({ message: 'Server error creating quiz' });
    }
};

exports.getQuizzes = async (req, res) => {
    try {
        const { teacher, course } = req.query;
        const filter = {};
        if (teacher) filter.teacher = teacher;
        if (course) filter.course = course;

        const quizzes = await Quiz.find(filter).populate('teacher', 'fullName email').sort('-createdAt');
        res.status(200).json(quizzes);
    } catch (err) {
        console.error("Error fetching quizzes:", err);
        res.status(500).json({ message: 'Server error fetching quizzes' });
    }
};

exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('teacher', 'fullName');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.status(200).json(quiz);
    } catch (err) {
        console.error("Error fetching quiz:", err);
        res.status(500).json({ message: 'Server error fetching quiz' });
    }
};

exports.submitQuizAttempt = async (req, res) => {
    try {
        const quizId = req.params.id;
        const { studentId, answers } = req.body; // array of { questionId, answerText }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        let totalMarksObtained = 0;
        const evaluatedAnswers = answers.map(ans => {
            const q = quiz.questions.id(ans.questionId);
            if (!q) return ans;

            let marksObtained = 0;
            let feedback = "";

            // simple auto-eval for MCQ
            if (q.type === 'MCQ') {
                if (q.correctAnswer === ans.answerText) {
                    marksObtained = q.marks;
                    feedback = "Correct";
                } else {
                    feedback = `Incorrect. Correct answer is ${q.correctAnswer}`;
                }
            } else {
                // Here we could call LLM to evaluate Essay/Structured...
                // For now, give partial mock feedback or 0 requiring manual review
                feedback = "Pending manual review / Requires AI grading";
            }

            totalMarksObtained += marksObtained;

            return {
                questionId: q._id,
                answerText: ans.answerText,
                marksObtained,
                feedback
            };
        });

        const attempt = new QuizAttempt({
            student: studentId,
            quiz: quizId,
            answers: evaluatedAnswers,
            totalMarksObtained
        });

        await attempt.save();

        res.status(201).json({ message: 'Quiz attempt saved', attempt, totalMarksObtained });
    } catch (err) {
        console.error("Error submitting quiz attempt:", err);
        res.status(500).json({ message: 'Server error submitting attempt' });
    }
};

exports.getAttemptsByStudent = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ student: req.params.studentId })
            .populate('quiz', 'title course totalMarks')
            .sort('-submittedAt');
        res.status(200).json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching attempts' });
    }
};

exports.getQuizReports = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
            .populate('student', 'fullName email')
            .sort('-totalMarksObtained');
        res.status(200).json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching reports' });
    }
};

exports.updateQuiz = async (req, res) => {
    try {
        const { dueDate, questions } = req.body;
        const quizId = req.params.id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Update fields
        if (dueDate) quiz.dueDate = dueDate;
        if (questions) {
            quiz.questions = questions;
            quiz.totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);
        }

        await quiz.save();
        res.status(200).json({ message: 'Quiz updated successfully', quiz });
    } catch (err) {
        console.error("Error updating quiz:", err);
        res.status(500).json({ message: 'Server error updating quiz' });
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const quiz = await Quiz.findByIdAndDelete(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Also delete attempts for this quiz
        await QuizAttempt.deleteMany({ quiz: quizId });

        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (err) {
        console.error("Error deleting quiz:", err);
        res.status(500).json({ message: 'Server error deleting quiz' });
    }
};
