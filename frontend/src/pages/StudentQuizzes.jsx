import { useState, useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { getQuizzes, getStudentAttempts, submitQuizAttempt } from '../utils/quizApi';
import '../styles/HomePage.css';

function StudentQuizzes() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'attempt', 'result'
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeResult, setActiveResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
    loadData();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const loadData = async () => {
    try {
      if (!user) return;
      const [qz, att] = await Promise.all([
        getQuizzes(),
        getStudentAttempts(user._id)
      ]);
      setQuizzes(qz);
      setAttempts(att);
    } catch (err) {
      console.error("Failed to load quizzes", err);
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => {
        secureLogout();
      }
    );
  };

  const hasAttempted = (quizId) => {
    return attempts.some(a => a.quiz?._id === quizId);
  };

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setView('attempt');
  };

  const viewResults = (quizId) => {
    const attempt = attempts.find(a => a.quiz?._id === quizId);
    if (attempt) {
      setActiveResult(attempt);
      setView('result');
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const submitAttempt = async () => {
    showConfirm(
      'Submit Quiz',
      'Are you sure you want to submit your answers?',
      async () => {
        setLoading(true);
        try {
          const formattedAnswers = Object.keys(answers).map(qId => ({
            questionId: qId,
            answerText: answers[qId]
          }));

          const result = await submitQuizAttempt(activeQuiz._id, {
            studentId: user._id,
            answers: formattedAnswers
          });

          await loadData();
          setActiveResult(result.attempt);
          setView('result');
        } catch (err) {
          console.error("Submission failed", err);
          alert("Failed to submit quiz.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Student Panel</div>
            <p className="sidebar-sub">Quizzes</p>
          </div>

          <nav className="sidebar-nav">
            <button className="sidebar-item" onClick={() => (window.location.href = '/student/dashboard')}>
              <span className="sidebar-bullet" /> Dashboard
            </button>
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" /> Quizzes
            </button>
            <button className="sidebar-item" onClick={() => (window.location.href = '/student/materials')}>
              <span className="sidebar-bullet" /> Course Materials
            </button>
            <button className="sidebar-item" onClick={() => (window.location.href = '/student/community')}>
              <span className="sidebar-bullet" /> Community
            </button>
            <button className="sidebar-item" onClick={() => (window.location.href = '/student/boardings')}>
              <span className="sidebar-bullet" /> Boardings
            </button>
            <button className="sidebar-item" onClick={() => (window.location.href = '/student/profile/edit')}>
              <span className="sidebar-bullet" /> Profile
            </button>
            <button className="sidebar-item" onClick={handleLogout}>
              <span className="sidebar-bullet" /> Logout
            </button>
          </nav>
        </aside>

        <main className="teacher-main" style={{ overflowY: 'auto' }}>
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">My Quizzes</h1>
              <p className="teacher-subtitle">
                Upcoming quizzes and attempts for <span>{studentName}</span>.
              </p>
            </div>
            <button className="teacher-avatar-btn" onClick={() => window.location.href = '/student/profile/edit'}>
              <img src={avatarSrc} alt="Student profile" className="teacher-avatar" />
            </button>
          </header>

          <section className="teacher-panel" style={{ marginTop: '20px', padding: '20px' }}>
            {view === 'list' && (
              <div>
                <h2>Available Quizzes</h2>
                {quizzes.length === 0 ? (
                  <p>No quizzes available right now.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                    {quizzes.map(quiz => (
                      <div key={quiz._id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', background: '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ margin: '0 0 5px 0' }}>{quiz.title}</h3>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>Course: {quiz.course} | Total Marks: {quiz.totalMarks}</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>{quiz.description}</p>
                          </div>
                          <div>
                            {hasAttempted(quiz._id) ? (
                              <button className="btn-outline" onClick={() => viewResults(quiz._id)}>View Results</button>
                            ) : (
                              <button className="btn-primary" onClick={() => startQuiz(quiz)}>Attempt Quiz</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'attempt' && activeQuiz && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>{activeQuiz.title}</h2>
                  <button className="btn-outline" onClick={() => setView('list')}>Cancel</button>
                </div>
                <p style={{ color: '#666', marginBottom: '20px' }}>{activeQuiz.description}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>
                        {idx + 1}. {q.questionText} <span style={{ color: '#888', fontWeight: 'normal', fontSize: '0.9em' }}>({q.marks} Marks)</span>
                      </p>

                      {q.type === 'MCQ' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={`question-${q._id}`}
                                value={opt}
                                checked={answers[q._id] === opt}
                                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          rows="4"
                          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                          placeholder="Type your answer here..."
                          value={answers[q._id] || ''}
                          onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '30px', textAlign: 'right' }}>
                  <button
                    className="btn-primary"
                    onClick={submitAttempt}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Answers'}
                  </button>
                </div>
              </div>
            )}

            {view === 'result' && activeResult && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Quiz Results</h2>
                  <button className="btn-outline" onClick={() => setView('list')}>Back to List</button>
                </div>

                <div style={{ background: '#eef9f0', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>Score: {activeResult.totalMarksObtained} / {activeResult.quiz?.totalMarks || '?'}</h3>
                  <p style={{ margin: 0, color: '#155724' }}>Submitted on: {new Date(activeResult.submittedAt).toLocaleString()}</p>
                </div>

                <div>
                  <h3 style={{ marginBottom: '15px' }}>Detailed Feedback</h3>
                  {activeResult.answers.map((ans, idx) => (
                    <div key={idx} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                      <p><strong>Question {idx + 1}:</strong> {ans.answerText}</p>
                      <p style={{ color: ans.marksObtained > 0 ? 'green' : 'red', marginTop: '10px' }}>
                        <strong>Marks:</strong> {ans.marksObtained}
                        <br />
                        <strong>Feedback:</strong> {ans.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        onConfirm={handleConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        singleButton={modal.singleButton}
      />
    </div>
  );
}

export default StudentQuizzes;
