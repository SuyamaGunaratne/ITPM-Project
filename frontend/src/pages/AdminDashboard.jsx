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
    </div>
  );
}

export default AdminDashboard;

