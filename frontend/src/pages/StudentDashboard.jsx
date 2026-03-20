import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { getQuizzes } from '../utils/quizApi';
import '../styles/HomePage.css';

function StudentDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const fetchQuizzes = async () => {
      if (!user?.course) {
        setLoading(false);
        return;
      }
      try {
        const data = await getQuizzes({ course: user.course });
        setQuizzes(data || []);
      } catch (err) {
        console.error("Error fetching student quizzes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => {
        secureLogout();
      }
    );
  };

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Student Panel</div>
            <p className="sidebar-sub">Dashboard</p>
          </div>

          <nav className="sidebar-nav">
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" />
              Dashboard
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/quizzes')}
            >
              <span className="sidebar-bullet" />
              Quizzes
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/materials')}
            >
              <span className="sidebar-bullet" />
              Course Materials
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/community')}
            >
              <span className="sidebar-bullet" />
              Community
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/boardings')}
            >
              <span className="sidebar-bullet" />
              Boardings
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/profile/edit')}
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

        <main className="teacher-main">
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">Dashboard</h1>
              <p className="teacher-subtitle">
                Welcome back, <span>{studentName}</span>. Here is an overview of
                your courses and activities.
              </p>
            </div>
            <button
              className="teacher-avatar-btn"
              onClick={() => (window.location.href = '/student/profile/edit')}
              title="Edit your profile"
            >
              <img
                src={avatarSrc}
                alt="Student profile"
                className="teacher-avatar"
              />
            </button>
          </header>

          <section className="teacher-panels">
            <div className="teacher-panel">
              <h2>Recent Course Materials</h2>
              <ul className="teacher-list">
                <li>Week 05 – Lecture Slides on Databases</li>
                <li>Assignment 02 – Web Development</li>
                <li>Reading List – Software Engineering</li>
              </ul>
            </div>
            <div className="teacher-panel">
              <h2>Upcoming Quizzes</h2>
              <ul className="teacher-list">
                {loading ? (
                  <li>Loading quizzes...</li>
                ) : quizzes.length > 0 ? (
                  quizzes.slice(0, 5).map(quiz => (
                    <li key={quiz._id} style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => window.location.href = `/student/quizzes`}>
                      <span>{quiz.title} - {quiz.course}</span>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>
                        {quiz.dueDate ? `Due: ${new Date(quiz.dueDate).toLocaleDateString()}` : 'No due date'}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>No quizzes available for your course yet.</li>
                )}
              </ul>
            </div>
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

export default StudentDashboard;
