import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function TeacherMaterials() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

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

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Teacher Panel</div>
            <p className="sidebar-sub">Materials</p>
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
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" />
              Study Materials
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/quizzes/publish')}
            >
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

        <main className="teacher-main">
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">Study Materials</h1>
              <p className="teacher-subtitle">
                Manage lecture notes and files for <span>{teacherName}</span>.
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

          <section className="teacher-panel">
            <div className="teacher-panel-head">
              <h2>Uploaded Materials</h2>
              <button className="btn-primary teacher-small-btn" type="button">
                Upload New
              </button>
            </div>

            <ul className="teacher-material-list">
              <li>
                <div>
                  <div className="teacher-material-title">
                    Week 06 – Software Architecture Slides
                  </div>
                  <div className="teacher-material-sub">PDF • Uploaded 2 days ago</div>
                </div>
                <button className="btn-outline teacher-small-btn" type="button">
                  Edit
                </button>
              </li>
              <li>
                <div>
                  <div className="teacher-material-title">
                    Lab Sheet – REST APIs
                  </div>
                  <div className="teacher-material-sub">DOCX • Uploaded 1 week ago</div>
                </div>
                <button className="btn-outline teacher-small-btn" type="button">
                  Edit
                </button>
              </li>
              <li>
                <div>
                  <div className="teacher-material-title">
                    Reading List – Distributed Systems
                  </div>
                  <div className="teacher-material-sub">Link • Uploaded 2 weeks ago</div>
                </div>
                <button className="btn-outline teacher-small-btn" type="button">
                  Edit
                </button>
              </li>
            </ul>
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

export default TeacherMaterials;

