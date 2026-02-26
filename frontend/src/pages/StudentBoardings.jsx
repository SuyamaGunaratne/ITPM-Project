import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function StudentBoardings() {
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
            <p className="sidebar-sub">Boardings</p>
          </div>

          <nav className="sidebar-nav">
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/dashboard')}
            >
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
            <button className="sidebar-item sidebar-item-active">
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
              <h1 className="teacher-title">Boardings</h1>
              <p className="teacher-subtitle">
                Browse nearby boarding places for <span>{studentName}</span>.
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

export default StudentBoardings;

