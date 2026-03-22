const express = require('express');
const router = express.Router();
const multer = require('multer');
const quizController = require('../controllers/quizController');

// Multer setup for handling file uploads in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB maximum
});

// Generate quiz questions (expects form data: modulePdf, course, type, count, marksPerQuestion, etc.)
router.post('/generate', upload.single('modulePdf'), quizController.generateQuizWithLLM);

// Create and publish a quiz
router.post('/', quizController.createQuiz);

// Get all quizzes
router.get('/', quizController.getQuizzes);

// Get specific quiz
router.get('/:id', quizController.getQuizById);

// Submit quiz attempt
router.post('/:id/attempt', quizController.submitQuizAttempt);

// Get attempts by a specific student
router.get('/attempts/student/:studentId', quizController.getAttemptsByStudent);

// Get reports for a specific quiz
router.get('/attempts/quiz/:quizId', quizController.getQuizReports);

// Update quiz (Only dueDate and questions)
router.put('/:id', quizController.updateQuiz);

// Delete quiz
router.delete('/:id', quizController.deleteQuiz);

module.exports = router;
