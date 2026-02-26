import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function StudentDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const studentName = user?.fullName || user?.name || 'Student';
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
                <li>Quiz 02 – Data Structures (Due Friday)</li>
                <li>Quiz 01 – Programming Fundamentals (Next Week)</li>
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
