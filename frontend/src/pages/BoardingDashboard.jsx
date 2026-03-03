import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import '../styles/HomePage.css';

function BoardingDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    // Check if user is logged in
    const user = window.localStorage.getItem('unihub_user');
    if (!user) {
      window.location.href = '/login';
    }
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const ownerName = user?.name || 'Boarding Owner';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => {
        // Simple logout - clear localStorage and redirect
        window.localStorage.removeItem('unihub_user');
        window.location.href = '/';
      }
    );
  };

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Boarding Panel</div>
            <p className="sidebar-sub">My Properties</p>
          </div>
          <nav className="sidebar-nav">
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" />
              Dashboard
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
              <h1 className="teacher-title">Boarding Owner Dashboard</h1>
              <p className="teacher-subtitle">
                Welcome back, <span>{ownerName}</span>.
              </p>
            </div>
            <button className="teacher-avatar-btn" onClick={handleLogout}>
              <img src={avatarSrc} alt="Profile" className="teacher-avatar" />
            </button>
          </header>
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

export default BoardingDashboard;

