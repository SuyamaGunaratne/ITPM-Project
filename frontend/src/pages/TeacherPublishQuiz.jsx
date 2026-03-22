import { useState, useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { generateQuizQuestions, publishQuiz, getQuizzes, updateQuiz, deleteQuiz } from '../utils/quizApi';
import '../styles/HomePage.css';

function TeacherPublishQuiz() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  const [formData, setFormData] = useState({
    title: '',
    course: '',
    dueDate: '',
    description: ''
  });

  const [aiConfig, setAiConfig] = useState({
    modulePdf: null,
    questionType: 'MCQ',
    numberOfQuestions: 5,
    marksPerQuestion: 1
  });

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Phase 2: Quiz Management state
  const [publishedQuizzes, setPublishedQuizzes] = useState([]);
  const [showPublishedList, setShowPublishedList] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const teacherName = user?.fullName || user?.name || 'Teacher';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => {
        secureLogout();
      }
    );
  };

  const fetchPublishedQuizzes = async () => {
    setIsFetchingQuizzes(true);
    try {
      const data = await getQuizzes({ teacher: user._id });
      setPublishedQuizzes(data || []);
    } catch (err) {
      console.error("Error fetching published quizzes:", err);
    } finally {
      setIsFetchingQuizzes(false);
    }
  };

  const togglePublishedList = () => {
    if (!showPublishedList) {
      fetchPublishedQuizzes();
    }
    setShowPublishedList(!showPublishedList);
  };

  const handleDeleteQuiz = async (id) => {
    showConfirm('Delete Quiz', 'Are you sure you want to delete this quiz permanently?', async () => {
      try {
        await deleteQuiz(id);
        setPublishedQuizzes(publishedQuizzes.filter(q => q._id !== id));
      } catch (err) {
        console.error("Error deleting quiz:", err);
        setErrorMsg('Failed to delete quiz.');
      }
    });
  };

  const startEditingQuiz = (quiz) => {
    setEditingQuizId(quiz._id);
    setFormData({
      title: quiz.title,
      course: quiz.course,
      dueDate: quiz.dueDate ? new Date(quiz.dueDate).toISOString().split('T')[0] : '',
      description: quiz.description || ''
    });
    setGeneratedQuestions(quiz.questions);
    setShowPublishedList(false);
    setErrorMsg('');
  };

  const cancelFullEdit = () => {
    setEditingQuizId(null);
    setFormData({ title: '', course: '', dueDate: '', description: '' });
    setGeneratedQuestions([]);
    setErrorMsg('');
  };

  const startEditing = (idx) => {
    setEditingIndex(idx);
    setEditForm({ ...generatedQuestions[idx], options: [...(generatedQuestions[idx].options || [])] });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (optIdx, value) => {
    const newOptions = [...editForm.options];
    newOptions[optIdx] = value;
    setEditForm(prev => ({ ...prev, options: newOptions }));
  };

  const saveEdit = () => {
    const updated = [...generatedQuestions];
    updated[editingIndex] = editForm;
    setGeneratedQuestions(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const removeQuestion = (idx) => {
    showConfirm('Remove Question', 'Are you sure you want to remove this question?', () => {
      const updated = generatedQuestions.filter((_, i) => i !== idx);
      setGeneratedQuestions(updated);
      if (editingIndex === idx) cancelEdit();
    });
  };

  const handleGenerate = async () => {
    if (!aiConfig.modulePdf) {
      setErrorMsg('Please upload a module PDF first.');
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);

    try {
      const data = new FormData();
      data.append('modulePdf', aiConfig.modulePdf);
      data.append('course', formData.course);
      data.append('questionType', aiConfig.questionType);
      data.append('numberOfQuestions', aiConfig.numberOfQuestions);
      data.append('marksPerQuestion', aiConfig.marksPerQuestion);

      const response = await generateQuizQuestions(data);
      if (response && response.questions) {
        setGeneratedQuestions(response.questions);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to generate questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (generatedQuestions.length === 0) {
      setErrorMsg('Please generate questions before publishing.');
      return;
    }
    if (!formData.title || !formData.course) {
      setErrorMsg('Title and Course are required.');
      return;
    }

    setIsPublishing(true);
    setErrorMsg('');

    try {
      const quizPayload = {
        title: formData.title,
        course: formData.course,
        description: formData.description,
        dueDate: formData.dueDate,
        teacherId: user._id, 
        questions: generatedQuestions
      };

      if (editingQuizId) {
        await updateQuiz(editingQuizId, quizPayload);
        showConfirm('Success', 'Quiz updated successfully!', () => {
          cancelFullEdit();
          togglePublishedList();
        });
      } else {
        await publishQuiz(quizPayload);
        showConfirm('Success', 'Quiz published successfully!', () => {
          window.location.href = '/teacher/dashboard';
        });
      }

    } catch (err) {
      console.error(err);
      setErrorMsg(editingQuizId ? 'Failed to update quiz.' : 'Failed to publish quiz.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Teacher Panel</div>
            <p className="sidebar-sub">Quizzes</p>
          </div>

          <nav className="sidebar-nav">
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/dashboard')}
            >
              <span className="sidebar-bullet" />
              Dashboard
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/students')}
            >
              <span className="sidebar-bullet" />
              View Students
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/materials')}
            >
              <span className="sidebar-bullet" />
              Study Materials
            </button>
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" />
              Publish Quiz
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/profile/edit')}
            >
              <span className="sidebar-bullet" />
              Profile
            </button>
            <button className="sidebar-item" onClick={handleLogout}>
              <span className="sidebar-bullet" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="teacher-main" style={{ overflowY: 'auto' }}>
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">Publish Quiz</h1>
              <p className="teacher-subtitle">
                Create and publish quizzes for <span>{teacherName}</span>.
              </p>
            </div>
            <button
              className="teacher-avatar-btn"
              onClick={() => (window.location.href = '/teacher/profile/edit')}
              title="Edit your profile"
            >
              <img
                src={avatarSrc}
                alt="Teacher profile"
                className="teacher-avatar"
              />
            </button>
          </header>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center' }}>
            <button 
              className={`tab-btn ${!showPublishedList ? 'active' : ''}`}
              onClick={() => { setShowPublishedList(false); if(editingQuizId) cancelFullEdit(); }}
            >
              {editingQuizId ? 'Editing Quiz' : 'Publish New Quiz'}
            </button>
            <button 
              className={`tab-btn ${showPublishedList ? 'active' : ''}`}
              onClick={togglePublishedList}
            >
              Published Quizzes
            </button>
          </div>

          {showPublishedList ? (
            <div className="quiz-management-container">
              <div className="quiz-management-header">
                <h2>Published Quizzes</h2>
                <button className="btn-purple-gradient" onClick={() => setShowPublishedList(false)}>+ Publish New</button>
              </div>
              
              <div className="quiz-cards-list">
                {isFetchingQuizzes ? (
                  <p>Loading quizzes...</p>
                ) : publishedQuizzes.length > 0 ? (
                  publishedQuizzes.map(quiz => (
                    <div key={quiz._id} className="quiz-card-item">
                      <div className="quiz-card-content">
                        <h3>{quiz.title}</h3>
                        <p className="quiz-card-meta">
                          <span>{quiz.course}</span> • 
                          <span>{quiz.questions?.length || 0} Questions</span> • 
                          <span>{quiz.dueDate ? `Due: ${new Date(quiz.dueDate).toLocaleDateString()}` : 'No due date'}</span>
                        </p>
                      </div>
                      <div className="quiz-card-actions">
                        <button className="btn-edit-badge" onClick={() => startEditingQuiz(quiz)}>Edit</button>
                        <button className="btn-delete-badge" onClick={() => handleDeleteQuiz(quiz._id)}>Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No published quizzes found.</p>
                )}
              </div>
            </div>
          ) : (
            <section className="teacher-panel teacher-quiz-form" style={{ marginTop: '20px' }}>
              <div className="teacher-panel-head">
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b' }}>{editingQuizId ? 'Edit Quiz Details' : 'New Quiz Details'}</h2>
                {editingQuizId && (
                  <button onClick={cancelFullEdit} className="btn-outline" style={{ padding: '8px 15px', width: 'auto', fontSize: '0.85em', borderRadius: '1rem' }}>Cancel Edit</button>
                )}
              </div>
            {errorMsg && <div style={{ color: 'red', marginBottom: '15px' }}>{errorMsg}</div>}

            <form onSubmit={handlePublish}>
              <div className="form-group">
                <label>Quiz Title</label>
                <input
                  type="text"
                  placeholder="e.g. OOP Basics"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Course</label>
                <input
                  type="text"
                  placeholder="e.g. ITPM"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  disabled={!!editingQuizId}
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Short instructions for students"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ccc' }} />

              {!editingQuizId && (
                <>
                  <div className="teacher-panel-head">
                    <h2>AI Question Generation Parameters</h2>
                  </div>

              <div className="form-group">
                <label>Upload Module/PDF Reference</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setAiConfig({ ...aiConfig, modulePdf: e.target.files[0] })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Question Type</label>
                  <select
                    value={aiConfig.questionType}
                    onChange={(e) => setAiConfig({ ...aiConfig, questionType: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="Essay">Essay</option>
                    <option value="Structured">Structured</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Number of Questions</label>
                  <input
                    type="number"
                    min="1" max="50"
                    value={aiConfig.numberOfQuestions}
                    onChange={(e) => setAiConfig({ ...aiConfig, numberOfQuestions: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Marks Distribution (per Question)</label>
                  <input
                    type="number"
                    min="1" max="100"
                    value={aiConfig.marksPerQuestion}
                    onChange={(e) => setAiConfig({ ...aiConfig, marksPerQuestion: e.target.value })}
                  />
                </div>
              </div>

                  <div style={{ margin: '20px 0' }}>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="btn-outline"
                      disabled={isGenerating}
                      style={{ width: 'auto', padding: '10px 20px' }}
                    >
                      {isGenerating ? 'Generating with AI...' : 'Generate Questions'}
                    </button>
                  </div>
                </>
              )}

              {generatedQuestions.length > 0 && (
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Generated Questions (Preview)</h3>
                  {generatedQuestions.map((q, idx) => (
                    <div key={idx} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
                      {editingIndex === idx ? (
                        <div style={{ padding: '15px', background: '#fff', border: '1px solid #0056b3', borderRadius: '5px' }}>
                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Question Text</label>
                            <textarea
                              rows="2"
                              value={editForm.questionText}
                              onChange={(e) => handleEditChange('questionText', e.target.value)}
                              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                          </div>
                          
                          {editForm.type === 'MCQ' && (
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Options</label>
                              {editForm.options?.map((opt, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(i, e.target.value)}
                                  placeholder={`Option ${i + 1}`}
                                  style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                              ))}
                              <div className="form-group" style={{ marginTop: '10px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Correct Answer</label>
                                <select 
                                  value={editForm.correctAnswer} 
                                  onChange={(e) => handleEditChange('correctAnswer', e.target.value)}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                  {editForm.options?.map((opt, i) => (
                                    <option key={i} value={opt}>{opt || `Option ${i + 1}`}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                          
                          {editForm.type !== 'MCQ' && (
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Grading Criteria / Correct Answer</label>
                              <textarea
                                rows="2"
                                value={editForm.correctAnswer}
                                onChange={(e) => handleEditChange('correctAnswer', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                              />
                            </div>
                          )}

                          <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Marks</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={editForm.marks}
                              onChange={(e) => handleEditChange('marks', parseInt(e.target.value) || 1)}
                              style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={saveEdit} className="btn-primary" style={{ padding: '6px 15px', fontSize: '14px', width: 'auto' }}>Save Changes</button>
                            <button type="button" onClick={cancelEdit} className="btn-outline" style={{ padding: '6px 15px', fontSize: '14px', width: 'auto' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <p><strong>Q{idx + 1}:</strong> {q.questionText}</p>
                            {q.type === 'MCQ' && q.options && (
                              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                                {q.options.map((opt, i) => (
                                  <li key={i} style={{ color: opt === q.correctAnswer ? 'green' : 'inherit', fontWeight: opt === q.correctAnswer ? 'bold' : 'normal' }}>
                                    {opt} {opt === q.correctAnswer && '(Correct)'}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {q.type !== 'MCQ' && (
                              <p style={{ color: 'green', margin: '8px 0' }}><em>Grading Criteria: {q.correctAnswer}</em></p>
                            )}
                            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Marks: {q.marks}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                            <button 
                              type="button" 
                              onClick={() => startEditing(idx)} 
                              style={{ background: '#ffffff', color: '#333', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em', fontWeight: '500' }}
                            >
                              Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => removeQuestion(idx)} 
                              style={{ background: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em', fontWeight: '500' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="teacher-profile-actions" style={{ marginTop: '20px' }}>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={isPublishing || generatedQuestions.length === 0}
                >
                  {isPublishing ? 'Processing...' : (editingQuizId ? 'Update Quiz' : 'Publish Quiz')}
                </button>
                <button
                  className="btn-outline"
                  type="button"
                  onClick={editingQuizId ? cancelFullEdit : () => (window.location.href = '/teacher/dashboard')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
          )}
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

export default TeacherPublishQuiz;
