import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from './Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Boarding Owner Requests', path: '/admin/boarding-registrations' },
  { label: 'Student Management', path: '/admin/students' },
  { label: 'Teacher Management', path: '/admin/teachers' },
  { label: 'Boarding Owner Management', path: '/admin/boarding-owners' },
  { label: 'Community Post Approvals', path: '/admin/post-requests' },
];

function AdminLayout({ title, subtitle, activePath, children }) {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    if (!checkAuthAndPreventCaching()) return;
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

  const renderNavButton = (item) => {
    const isActive = activePath === item.path;
    return (
      <button
        key={item.path}
        className={`sidebar-item${isActive ? ' sidebar-item-active' : ''}`}
        onClick={() => (window.location.href = item.path)}
      >
        <span className="sidebar-bullet" />
        {item.label}
      </button>
    );
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
            {navItems.map(renderNavButton)}
            <button className="sidebar-item" onClick={handleLogout} style={{ color: '#dc3545', marginTop: 'auto' }}>
              <span className="sidebar-bullet" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="teacher-main">
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">{title}</h1>
              {subtitle && (
                <p className="teacher-subtitle">
                  {subtitle} <span>{adminName}</span>.
                </p>
              )}
            </div>
            <button className="teacher-avatar-btn" onClick={handleLogout}>
              <img src={avatarSrc} alt="Profile" className="teacher-avatar" />
            </button>
          </header>

          {children}
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

export default AdminLayout;
