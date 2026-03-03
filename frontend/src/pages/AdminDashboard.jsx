import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function AdminDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

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

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Admin Panel</div>
            <p className="sidebar-sub">System Management</p>
          </div>
          <nav className="sidebar-nav">
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" />
              Dashboard
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

        <main className="teacher-main">
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
          <div className="dashboard-content">
            <div className="welcome-card">
              <h2>Welcome to Admin Panel</h2>
              <p>Manage registration requests, approve/reject boarding owner applications, and oversee system operations.</p>
              <button className="btn-primary" onClick={handleBoardingRequests}>
                View Boarding Owner Requests →
              </button>
            </div>
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

