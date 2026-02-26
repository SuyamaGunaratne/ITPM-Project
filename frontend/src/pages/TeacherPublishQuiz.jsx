import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function TeacherPublishQuiz() {
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

        <main className="teacher-main">
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

          <section className="teacher-panel teacher-quiz-form">
            <div className="teacher-panel-head">
              <h2>New Quiz</h2>
              <button className="btn-outline teacher-small-btn" type="button">
                Save Draft
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Hook up to backend quiz module later
              }}
            >
              <div className="form-group">
                <label htmlFor="quizTitle">Quiz Title</label>
                <input id="quizTitle" type="text" placeholder="e.g. OOP Basics" />
              </div>

              <div className="form-group">
                <label htmlFor="quizCourse">Course</label>
                <input id="quizCourse" type="text" placeholder="e.g. ITPM" />
              </div>

              <div className="form-group">
                <label htmlFor="quizDue">Due Date</label>
                <input id="quizDue" type="date" />
              </div>

              <div className="form-group">
                <label htmlFor="quizDesc">Description</label>
                <textarea
                  id="quizDesc"
                  rows="4"
                  placeholder="Short instructions for students"
                />
              </div>

              <div className="teacher-profile-actions">
                <button className="btn-primary" type="submit">
                  Publish Quiz
                </button>
                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => (window.location.href = '/teacher/dashboard')}
                >
                  Cancel
                </button>
              </div>
            </form>
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

export default TeacherPublishQuiz;

