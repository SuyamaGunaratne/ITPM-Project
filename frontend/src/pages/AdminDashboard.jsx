import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { getQuizzes, getQuizReports } from '../utils/quizApi';
import '../styles/HomePage.css';

function AdminDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();
  const [view, setView] = useState('dashboard');
  const [quizzes, setQuizzes] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeQuizTitle, setActiveQuizTitle] = useState('');

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

  useEffect(() => {
    if (view === 'quizzes') {
      loadQuizzes();
    }
  }, [view]);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const adminName = user?.name || 'Admin';
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

  const handleBoardingRequests = () => {
    window.location.href = '/admin/boarding-registrations';
  };

  const loadQuizzes = async () => {
    try {
      const allQuizzes = await getQuizzes({});
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error("Failed to load quizzes", err);
    }
  };

  const viewReport = async (quizId, title) => {
    try {
      const rep = await getQuizReports(quizId);
      setReports(rep);
      setActiveQuizTitle(title);
      setView('reports');
    } catch (err) {
      console.error("Failed to load reports", err);
    }
  };

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Admin Panel</div>
            <p className="sidebar-sub">System Management</p>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${view === 'dashboard' ? 'sidebar-item-active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              <span className="sidebar-bullet" />
              Dashboard
            </button>
            <button
              className={`sidebar-item ${view === 'quizzes' || view === 'reports' ? 'sidebar-item-active' : ''}`}
              onClick={() => setView('quizzes')}
            >
              <span className="sidebar-bullet" />
              Quiz Reports
            </button>
            <button className="sidebar-item" onClick={handleBoardingRequests}>
              <span className="sidebar-bullet" />
              Boarding Owner Requests
            </button>
            <button className="sidebar-item" onClick={handleLogout} style={{ color: '#dc3545', marginTop: 'auto' }}>
              <span className="sidebar-bullet" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="teacher-main" style={{ overflowY: 'auto' }}>
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">Admin Dashboard</h1>
              <p className="teacher-subtitle">
                Welcome back, <span>{adminName}</span>.
              </p>
            </div>
            <button className="teacher-avatar-btn" onClick={handleLogout}>
              <img src={avatarSrc} alt="Profile" className="teacher-avatar" />
            </button>
          </header>

          <div className="dashboard-content" style={{ padding: '20px' }}>
            {view === 'dashboard' && (
              <div className="welcome-card">
                <h2>Welcome to Admin Panel</h2>
                <p>Manage registration requests, approve/reject boarding owner applications, and oversee system operations.</p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                  <button className="btn-primary" onClick={handleBoardingRequests}>
                    Boarding Owner Requests →
                  </button>
                  <button className="btn-outline" onClick={() => setView('quizzes')}>
                    View Quiz Activity →
                  </button>
                </div>
              </div>
            )}

            {view === 'quizzes' && (
              <div>
                <h2>System Activity: All Published Quizzes</h2>
                <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                  {quizzes.map(quiz => (
                    <div key={quiz._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: '0 0 5px 0' }}>{quiz.title}</h3>
                          <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
                            Course: {quiz.course} | Total Marks: {quiz.totalMarks} | Teacher: {quiz.teacher?.fullName || 'Unknown'}
                          </p>
                        </div>
                        <button className="btn-outline" onClick={() => viewReport(quiz._id, quiz.title)}>
                          View Student Reports
                        </button>
                      </div>
                    </div>
                  ))}
                  {quizzes.length === 0 && <p>No quizzes currently running.</p>}
                </div>
              </div>
            )}

            {view === 'reports' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Reports for: {activeQuizTitle}</h2>
                  <button className="btn-outline" onClick={() => setView('quizzes')}>Back to Quizzes</button>
                </div>

                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
                  {reports.length === 0 ? (
                    <p style={{ padding: '20px' }}>No students have attempted this quiz yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #ddd' }}>Student Name</th>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #ddd' }}>Email</th>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #ddd' }}>Score</th>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #ddd' }}>Submitted At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map(rep => (
                          <tr key={rep._id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 15px' }}>{rep.student?.fullName || 'Unknown'}</td>
                            <td style={{ padding: '12px 15px' }}>{rep.student?.email || 'N/A'}</td>
                            <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#155724' }}>
                              {rep.totalMarksObtained} / {rep.quiz?.totalMarks || '?'}
                            </td>
                            <td style={{ padding: '12px 15px', color: '#666' }}>
                              {new Date(rep.submittedAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onCancel={closeModal}
        onConfirm={() => {
          handleConfirm();
          closeModal();
        }}
      />
    </div>
  );
}

export default AdminDashboard;
