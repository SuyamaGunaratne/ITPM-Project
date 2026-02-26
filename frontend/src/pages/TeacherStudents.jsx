import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function TeacherStudents() {
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
            <p className="sidebar-sub">Students</p>
          </div>

          <nav className="sidebar-nav">
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/dashboard')}
            >
              <span className="sidebar-bullet" />
              Dashboard
            </button>
            <button className="sidebar-item sidebar-item-active">
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
              <h1 className="teacher-title">View Students</h1>
              <p className="teacher-subtitle">
                Hello <span>{teacherName}</span>. Here is your student list.
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
              <h2>Students</h2>
              <button className="btn-outline teacher-small-btn" type="button">
                Export
              </button>
            </div>

            <div className="teacher-table-wrap">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Batch</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Amaya Perera</td>
                    <td>STU-1023</td>
                    <td>IT</td>
                    <td>Y3S2</td>
                  </tr>
                  <tr>
                    <td>Nimal Silva</td>
                    <td>STU-1188</td>
                    <td>SE</td>
                    <td>Y2S1</td>
                  </tr>
                  <tr>
                    <td>Kavindu Fernando</td>
                    <td>STU-1312</td>
                    <td>CS</td>
                    <td>Y1S2</td>
                  </tr>
                </tbody>
              </table>
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

export default TeacherStudents;

