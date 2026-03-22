import axios from 'axios';

const API_URL = 'http://localhost:5000/api/quizzes';

// Generate raw questions from AI logic
export const generateQuizQuestions = async (formData) => {
    // formData should contain modulePdf, course, questionType, numberOfQuestions, marksPerQuestion
    const response = await axios.post(`${API_URL}/generate`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

// Publish a generated quiz
export const publishQuiz = async (quizData) => {
    const response = await axios.post(API_URL, quizData);
    return response.data;
};

// Get quizzes for students or teachers
export const getQuizzes = async (params) => {
    // params could have course or teacher ID
    const response = await axios.get(API_URL, { params });
    return response.data;
};

// Get a specific quiz
export const getQuizById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

// Submit an attempt
export const submitQuizAttempt = async (quizId, attemptData) => {
    const response = await axios.post(`${API_URL}/${quizId}/attempt`, attemptData);
    return response.data;
};

// Get attempts for a student
export const getStudentAttempts = async (studentId) => {
    const response = await axios.get(`${API_URL}/attempts/student/${studentId}`);
    return response.data;
};

// Get reports for a teacher's quiz
export const getQuizReports = async (quizId) => {
    const response = await axios.get(`${API_URL}/attempts/quiz/${quizId}`);
    return response.data;
};

// Update a quiz
export const updateQuiz = async (id, quizData) => {
    const response = await axios.put(`${API_URL}/${id}`, quizData);
    return response.data;
};

// Delete a quiz
export const deleteQuiz = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};
