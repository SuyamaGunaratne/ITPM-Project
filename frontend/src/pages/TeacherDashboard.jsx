import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function TeacherDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const teacherName = user?.fullName || user?.name || 'Teacher';
  const teacherDepartment = user?.department || 'Faculty of Computing';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const [stats, setStats] = useState({
    activeCourses: '...',
    enrolledStudents: '...',
    pendingQuizzes: '...',
  });

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats/teacher-dashboard');
        if (!res.ok) return;
        const data = await res.json();
        setStats({
          activeCourses: data.activeCourses ?? 0,
          enrolledStudents: data.enrolledStudents ?? 0,
          pendingQuizzes: data.pendingQuizzes ?? 0,
        });
      } catch {
        // keep placeholders
      }
    };
    fetchStats();
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
            <div className="sidebar-brand">Teacher Panel</div>
            <p className="sidebar-sub">{teacherDepartment}</p>
          </div>

          <nav className="sidebar-nav">
            <button className="sidebar-item sidebar-item-active">
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
              <h1 className="teacher-title">Dashboard</h1>
              <p className="teacher-subtitle">
                Welcome back, <span>{teacherName}</span>. Here is an overview of
                your classes.
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

          <section className="teacher-cards">
            <div className="teacher-card">
              <h3>Active Courses</h3>
              <p className="teacher-card-value">{stats.activeCourses}</p>
              <p className="teacher-card-sub">
                Courses currently running this semester.
              </p>
            </div>
            <div className="teacher-card">
              <h3>Enrolled Students</h3>
              <p className="teacher-card-value">{stats.enrolledStudents}</p>
              <p className="teacher-card-sub">
                Total students across all your courses.
              </p>
            </div>
            <div className="teacher-card">
              <h3>Pending Quizzes</h3>
              <p className="teacher-card-value">{stats.pendingQuizzes}</p>
              <p className="teacher-card-sub">
                Draft quizzes waiting to be published.
              </p>
            </div>
          </section>

          <section className="teacher-panels">
            <div className="teacher-panel">
              <h2>Recent Study Materials</h2>
              <ul className="teacher-list">
                <li>Week 05 – Algorithms Lecture Slides</li>
                <li>Assignment 02 – Data Structures</li>
                <li>Reading List – Research Methods</li>
              </ul>
            </div>
            <div className="teacher-panel">
              <h2>Upcoming Quizzes</h2>
              <ul className="teacher-list">
                <li>Quiz 02 – OOP Concepts (Due Friday)</li>
                <li>Quiz 01 – Database Design (Next Week)</li>
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

export default TeacherDashboard;

