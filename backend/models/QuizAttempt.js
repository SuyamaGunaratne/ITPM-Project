const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },

    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId }, // Refers to questions inside Quiz model
        answerText: { type: String },
        marksObtained: { type: Number, default: 0 },
        feedback: { type: String } // optional feedback from teacher or AI auto-evaluation
    }],

    totalMarksObtained: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
