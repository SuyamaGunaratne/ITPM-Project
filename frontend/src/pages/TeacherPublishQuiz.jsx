import { useState, useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { teacherNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { generateQuizQuestions, publishQuiz, getQuizzes, updateQuiz, deleteQuiz } from '../utils/quizApi';

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

  const [publishedQuizzes, setPublishedQuizzes] = useState([]);
  const [showPublishedList, setShowPublishedList] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [isFetchingQuizzes, setIsFetchingQuizzes] = useState(false);

  // Results state
  const [viewingResultsQuiz, setViewingResultsQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [isFetchingResults, setIsFetchingResults] = useState(false);

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const teacherName = user?.fullName || user?.name || 'Teacher';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to logout?', () => secureLogout());
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

  const handleViewResults = async (quiz) => {
    setViewingResultsQuiz(quiz);
    setIsFetchingResults(true);
    setErrorMsg('');
    try {
      const { getQuizReports } = await import('../utils/quizApi');
      const results = await getQuizReports(quiz._id);
      setQuizResults(results || []);
    } catch (err) {
      console.error("Error fetching quiz results:", err);
      setErrorMsg('Failed to fetch quiz results.');
    } finally {
      setIsFetchingResults(false);
    }
  };

  const closeResultsView = () => {
    setViewingResultsQuiz(null);
    setQuizResults([]);
    setErrorMsg('');
  };

  const startEditing = (idx) => {
    setEditingIndex(idx);
    setEditForm({ ...generatedQuestions[idx], options: [...(generatedQuestions[idx].options || [])] });
  };

  const handleEditChange = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));
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

  const cancelEdit = () => { setEditingIndex(null); setEditForm(null); };

  const removeQuestion = (idx) => {
    showConfirm('Remove', 'Are you sure you want to remove this question?', () => {
      const updated = generatedQuestions.filter((_, i) => i !== idx);
      setGeneratedQuestions(updated);
      if (editingIndex === idx) cancelEdit();
    });
  };

  const handleGenerate = async () => {
    if (!aiConfig.modulePdf) return setErrorMsg('Please upload a module PDF first.');
    setErrorMsg(''); setIsGenerating(true);
    try {
      const data = new FormData();
      data.append('modulePdf', aiConfig.modulePdf);
      data.append('course', formData.course);
      data.append('questionType', aiConfig.questionType);
      data.append('numberOfQuestions', aiConfig.numberOfQuestions);
      data.append('marksPerQuestion', aiConfig.marksPerQuestion);

      const response = await generateQuizQuestions(data);
      if (response && response.questions) setGeneratedQuestions(response.questions);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (generatedQuestions.length === 0) return setErrorMsg('Please generate questions before publishing.');
    if (!formData.title || !formData.course) return setErrorMsg('Title and Course are required.');

    setIsPublishing(true); setErrorMsg('');
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
        showConfirm('Success', 'Quiz published successfully!', () => window.location.href = '/teacher/dashboard');
      }
    } catch (err) {
      setErrorMsg(editingQuizId ? 'Failed to update quiz.' : 'Failed to publish quiz.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <DashboardLayout
        role="Teacher"
        sidebarBrand="UniHub Teacher"
        sidebarSub="Quizzes"
        navItems={teacherNavItems}
        activePath="/teacher/quizzes/publish"
        userName={teacherName}
        userAvatar={avatarSrc}
        title="Publish Quiz"
        subtitleText={`Create and publish quizzes for ${teacherName}.`}
        onLogout={handleLogout}
      >
        <div className="w-full max-w-5xl mx-auto pb-12">
          
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 mb-8 pb-px">
            <button 
              className={`px-6 py-3 font-semibold text-sm transition-all whitespace-nowrap border-b-2 ${!showPublishedList ? 'border-primary-500 text-primary-600 bg-primary-50/50 dark:bg-primary-900/20 rounded-tl-xl rounded-tr-xl' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-tl-xl rounded-tr-xl'}`}
              onClick={() => { setShowPublishedList(false); if(editingQuizId) cancelFullEdit(); }}
            >
              {editingQuizId ? 'Editing Quiz' : 'Publish New Quiz'}
            </button>
            <button 
              className={`px-6 py-3 font-semibold text-sm transition-all whitespace-nowrap border-b-2 ${showPublishedList ? 'border-primary-500 text-primary-600 bg-primary-50/50 dark:bg-primary-900/20 rounded-tl-xl rounded-tr-xl' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-tl-xl rounded-tr-xl'}`}
              onClick={togglePublishedList}
            >
              Published Quizzes
            </button>
          </div>

          {viewingResultsQuiz ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Results: {viewingResultsQuiz.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{viewingResultsQuiz.course}</p>
                </div>
                <button className="btn-outline py-2 px-6 text-sm" onClick={closeResultsView}>← Back to Quizzes</button>
              </div>

              {isFetchingResults ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
                </div>
              ) : quizResults.length > 0 ? (
                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-dark-border">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Marks</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                      {quizResults.map((result) => (
                        <tr key={result._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white capitalize">{result.student?.fullName || 'N/A'}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{result.student?.email || 'N/A'}</td>
                          <td className="px-6 py-4">
                             <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${result.totalMarksObtained >= (viewingResultsQuiz.totalMarks / 2) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                               {result.totalMarksObtained} / {viewingResultsQuiz.totalMarks || '-'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                            {new Date(result.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-card p-10 rounded-2xl text-center">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No students have attempted this quiz yet.</p>
                </div>
              )}
            </div>
          ) : showPublishedList ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Published Quizzes</h2>
                <button className="btn-primary py-2 px-6 text-sm" onClick={() => setShowPublishedList(false)}>+ Publish New</button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {isFetchingQuizzes ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
                  </div>
                ) : publishedQuizzes.length > 0 ? (
                  publishedQuizzes.map(quiz => (
                    <div key={quiz._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                      <div>
                        <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-1">{quiz.title}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {quiz.course} &bull; {quiz.questions?.length || 0} Questions &bull; {quiz.dueDate ? `Due ${new Date(quiz.dueDate).toLocaleDateString()}` : 'No due date'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40 transition-colors shadow-sm" onClick={() => handleViewResults(quiz)}>View Results</button>
                        <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => startEditingQuiz(quiz)}>Edit</button>
                        <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors" onClick={() => handleDeleteQuiz(quiz._id)}>Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-card p-10 rounded-2xl text-center">
                    <p className="text-slate-500 dark:text-slate-400">No published quizzes found.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl p-6 lg:p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary-400 to-accent-500" />
              
              <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
                  {editingQuizId ? 'Edit Quiz Details' : 'New Quiz Details'}
                </h2>
                {editingQuizId && (
                  <button onClick={cancelFullEdit} className="btn-outline py-2 px-4 shadow-sm text-sm">Cancel Edit</button>
                )}
              </div>

              {errorMsg && <div className="p-4 mb-6 text-sm font-medium text-red-800 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">⚠ {errorMsg}</div>}

              <form onSubmit={handlePublish} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Quiz Title</label>
                    <input
                      type="text"
                      placeholder="e.g. OOP Basics"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Course</label>
                    <input
                      type="text"
                      placeholder="e.g. ITPM"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      disabled={!!editingQuizId}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description / Instructions</label>
                    <textarea
                      rows="3"
                      placeholder="Short instructions for students..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all resize-y"
                    />
                  </div>
                </div>

                {!editingQuizId && (
                  <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-bl-full -z-10" />
                    <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">✨ AI Question Generator</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2 md:col-span-3">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Upload Reference PDF</label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setAiConfig({ ...aiConfig, modulePdf: e.target.files[0] })}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Question Type</label>
                        <select
                          value={aiConfig.questionType}
                          onChange={(e) => setAiConfig({ ...aiConfig, questionType: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                        >
                          <option value="MCQ">MCQ</option>
                          <option value="Essay">Essay</option>
                          <option value="Structured">Structured</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Question Count</label>
                        <input
                          type="number" min="1" max="50"
                          value={aiConfig.numberOfQuestions}
                          onChange={(e) => setAiConfig({ ...aiConfig, numberOfQuestions: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Marks per Question</label>
                        <input
                          type="number" min="1" max="100"
                          value={aiConfig.marksPerQuestion}
                          onChange={(e) => setAiConfig({ ...aiConfig, marksPerQuestion: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-8 text-right">
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="btn-primary py-3 px-6 shadow-md shadow-primary-500/30"
                      >
                        {isGenerating ? 'Generating with AI...' : '✨ Generate Questions'}
                      </button>
                    </div>
                  </div>
                )}

                {generatedQuestions.length > 0 && (
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-6">Generated Questions ({generatedQuestions.length})</h3>
                    
                    <div className="space-y-4">
                      {generatedQuestions.map((q, idx) => (
                        <div key={idx} className="border border-slate-200 dark:border-dark-border rounded-2xl bg-slate-50/30 dark:bg-slate-800/10 overflow-hidden">
                          {editingIndex === idx ? (
                            <div className="p-6 bg-white dark:bg-dark-card shadow-lg ring-2 ring-primary-500 rounded-2xl">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Question Text</label>
                                  <textarea
                                    rows="2"
                                    value={editForm.questionText}
                                    onChange={(e) => handleEditChange('questionText', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                                  />
                                </div>
                                
                                {editForm.type === 'MCQ' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Options</label>
                                      <div className="space-y-2">
                                      {editForm.options?.map((opt, i) => (
                                        <input
                                          key={i}
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleOptionChange(i, e.target.value)}
                                          placeholder={`Option ${i + 1}`}
                                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                                        />
                                      ))}
                                      </div>
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Correct Answer</label>
                                      <select 
                                        value={editForm.correctAnswer} 
                                        onChange={(e) => handleEditChange('correctAnswer', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                                      >
                                        {editForm.options?.map((opt, i) => (
                                          <option key={i} value={opt}>{opt || `Option ${i + 1}`}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}
                                
                                {editForm.type !== 'MCQ' && (
                                  <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Grading Criteria / Correct Answer</label>
                                    <textarea
                                      rows="2"
                                      value={editForm.correctAnswer}
                                      onChange={(e) => handleEditChange('correctAnswer', e.target.value)}
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                                    />
                                  </div>
                                )}

                                <div>
                                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Marks</label>
                                  <input
                                    type="number" min="1" max="100"
                                    value={editForm.marks}
                                    onChange={(e) => handleEditChange('marks', parseInt(e.target.value) || 1)}
                                    className="w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                                  />
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                  <button type="button" onClick={saveEdit} className="btn-primary py-2 px-6 text-sm">Save Changes</button>
                                  <button type="button" onClick={cancelEdit} className="btn-outline py-2 px-6 text-sm">Cancel</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col md:flex-row justify-between items-start p-6 gap-6">
                              <div className="flex-1">
                                <p className="text-lg font-medium text-slate-900 dark:text-white mb-4"><span className="text-slate-400 font-bold mr-2">Q{idx + 1}.</span>{q.questionText}</p>
                                
                                {q.type === 'MCQ' && q.options && (
                                  <div className="space-y-2 pl-8">
                                    {q.options.map((opt, i) => (
                                      <div key={i} className={`px-4 py-2 rounded-lg border ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300 font-bold' : 'bg-white border-slate-200 text-slate-600 dark:bg-dark-card dark:border-slate-800 dark:text-slate-400'}`}>
                                        {opt} {opt === q.correctAnswer && <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700 uppercase tracking-widest">Correct</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {q.type !== 'MCQ' && (
                                  <div className="pl-8 mt-4">
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Grading Criteria</p>
                                    <p className="text-slate-700 dark:text-slate-300 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/40 p-3 rounded-xl">{q.correctAnswer}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex shrink-0 gap-2 md:flex-col items-center">
                                <div className="text-primary-600 dark:text-primary-400 font-bold text-center mb-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-lg">{q.marks} Pts</div>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => startEditing(idx)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors">Edit</button>
                                  <button type="button" onClick={() => removeQuestion(idx)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors">Remove</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
                  <button
                    className="btn-outline py-3 px-8"
                    type="button"
                    onClick={editingQuizId ? cancelFullEdit : () => (window.location.href = '/teacher/dashboard')}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary py-3 px-10 shadow-lg shadow-primary-500/30 text-lg"
                    type="submit"
                    disabled={isPublishing || generatedQuestions.length === 0}
                  >
                    {isPublishing ? 'Processing...' : (editingQuizId ? 'Update Quiz' : 'Publish Quiz')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DashboardLayout>

      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default TeacherPublishQuiz;
