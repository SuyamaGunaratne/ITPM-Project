import '../styles/HomePage.css';

function AdminDashboard() {
  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const adminName = user?.name || 'Admin';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    window.localStorage.removeItem('unihub_user');
    window.location.href = '/';
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
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;

