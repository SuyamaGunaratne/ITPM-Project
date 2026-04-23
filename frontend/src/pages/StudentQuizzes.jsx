import { useState, useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { studentNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { getQuizzes, getStudentAttempts, submitQuizAttempt } from '../utils/quizApi';

function StudentQuizzes() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'attempt', 'result'
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeResult, setActiveResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'completed'

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const [qz, att] = await Promise.all([
        getQuizzes(),
        getStudentAttempts(user._id)
      ]);
      setQuizzes(qz);
      setAttempts(att);
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to logout?', () => secureLogout());
  };

  const hasAttempted = (quizId) => attempts.some(a => a.quiz?._id === quizId);

  const pendingQuizzes = quizzes.filter(q => !hasAttempted(q._id));
  const completedQuizzes = quizzes.filter(q => hasAttempted(q._id));
  const displayedQuizzes = activeTab === 'pending' ? pendingQuizzes : completedQuizzes;

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
          const formattedAnswers = Object.keys(answers).map(qId => ({ questionId: qId, answerText: answers[qId] }));
          const result = await submitQuizAttempt(activeQuiz._id, { studentId: user._id, answers: formattedAnswers });
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
    <>
      <DashboardLayout
        role="Student"
        sidebarBrand="UniHub Student"
        sidebarSub="Quizzes"
        navItems={studentNavItems}
        activePath="/student/quizzes"
        userName={studentName}
        userAvatar={avatarSrc}
        title={view === 'attempt' ? activeQuiz?.title : view === 'result' ? 'Quiz Results' : 'My Quizzes'}
        subtitleText={view === 'attempt' ? activeQuiz?.description : "Upcoming quizzes and attempts"}
        onLogout={handleLogout}
      >
        <div className="w-full">
          {view === 'list' && (
            <div className="space-y-6">
              {/* Tab Switcher */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit mb-6">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'pending'
                      ? 'bg-white dark:bg-primary-600 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Pending Quizzes ({pendingQuizzes.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'completed'
                      ? 'bg-white dark:bg-primary-600 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Completed ({completedQuizzes.length})
                </button>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
                </div>
              ) : displayedQuizzes.length === 0 ? (
                <div className="glass-card p-10 rounded-2xl text-center">
                  <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/40 text-primary-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                    {activeTab === 'pending' ? '🎉' : '⏳'}
                  </div>
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                    {activeTab === 'pending' ? 'No Pending Quizzes' : 'No Completed Quizzes'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {activeTab === 'pending' 
                      ? "You've caught up on all your quizzes! Great job." 
                      : "You haven't completed any quizzes yet. Start one to see your results here."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedQuizzes.map(quiz => (
                    <div key={quiz._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary-400 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="p-3 bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl">📝</div>
                           <div>
                             <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-tight">{quiz.title}</h3>
                             <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{quiz.course} &bull; {quiz.totalMarks} Marks</p>
                           </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 line-clamp-2">{quiz.description}</p>
                      
                      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
                        {hasAttempted(quiz._id) ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold uppercase tracking-wider">✓ Completed</span>
                            <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors" onClick={() => viewResults(quiz._id)}>View Results</button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{quiz.dueDate ? `Due ${new Date(quiz.dueDate).toLocaleDateString()}` : 'No due date'}</span>
                            <button className="btn-primary py-2 px-5 text-sm" onClick={() => startQuiz(quiz)}>Attempt Quiz</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'attempt' && activeQuiz && (
            <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
              <div className="flex items-center justify-between">
                <div className="glass-panel px-4 py-2 rounded-full inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">Quiz Attempt in Progress</div>
                <button className="btn-secondary text-sm py-2 px-4 shadow-sm" onClick={() => setView('list')}>Save & Exit</button>
              </div>

              <div className="space-y-6">
                {activeQuiz.questions.map((q, idx) => (
                  <div key={q._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 lg:p-8 shadow-sm">
                    <div className="flex gap-4 mb-6">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed">{q.questionText}</p>
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mt-2">{q.marks} Points</p>
                      </div>
                    </div>

                    <div className="ml-12">
                      {q.type === 'MCQ' ? (
                        <div className="space-y-3">
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answers[q._id] === opt ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                              <input
                                type="radio"
                                name={`question-${q._id}`}
                                value={opt}
                                checked={answers[q._id] === opt}
                                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                className="w-5 h-5 text-primary-600 border-slate-300 focus:ring-primary-500"
                              />
                              <span className="text-slate-700 dark:text-slate-300 font-medium select-none">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          rows="4"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all outline-none resize-y"
                          placeholder="Type your answer here..."
                          value={answers[q._id] || ''}
                          onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-4 z-10 w-full glass-panel border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex justify-between items-center shadow-2xl mt-8">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 pl-4">{Object.keys(answers).length} of {activeQuiz.questions.length} Answered</span>
                <button className="btn-primary text-base py-3 px-8 shadow-lg shadow-primary-500/40" onClick={submitAttempt} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Answers'}
                </button>
              </div>
            </div>
          )}

          {view === 'result' && activeResult && (
            <div className="w-full max-w-3xl mx-auto space-y-6">
              <div className="text-center mb-8 pb-8 border-b border-slate-200 dark:border-dark-border">
                <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900/40 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6">🏆</div>
                <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">Quiz Completed!</h2>
                <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-6">You've successfully submitted your answers.</p>
                <div className="inline-block glass-card border border-green-200 dark:border-green-800/50 p-6 rounded-2xl shadow-sm">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-500 uppercase tracking-widest mb-1">Final Score</p>
                  <p className="text-5xl font-heading font-black text-slate-900 dark:text-white">{activeResult.totalMarksObtained} <span className="text-2xl text-slate-400 font-medium">/ {activeResult.quiz?.totalMarks || '?'}</span></p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Detailed Review</h3>
                <button className="btn-secondary py-2 px-4 shadow-sm text-sm" onClick={() => setView('list')}>Return to Quizzes</button>
              </div>

              <div className="space-y-4 pb-12">
                {activeResult.answers.map((ans, idx) => {
                  const isCorrect = ans.marksObtained > 0;
                  return (
                    <div key={idx} className={`border rounded-2xl p-6 ${isCorrect ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900/50' : 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50'}`}>
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100"><span className="text-slate-500 mr-2 font-bold">{idx + 1}.</span> {ans.answerText}</p>
                        <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold ${isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'}`}>
                          {isCorrect ? `+${ans.marksObtained}` : '0'} pts
                        </span>
                      </div>
                      <div className="bg-white/60 dark:bg-dark-card/60 rounded-xl p-4 border border-slate-100 dark:border-white/5 inline-block mt-2">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Feedback</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{ans.feedback || (isCorrect ? 'Correct!' : 'Incorrect.')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default StudentQuizzes;
