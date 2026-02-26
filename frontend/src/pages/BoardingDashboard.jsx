import '../styles/HomePage.css';

function BoardingDashboard() {
  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const ownerName = user?.name || 'Boarding Owner';
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
            <div className="sidebar-brand">Boarding Panel</div>
            <p className="sidebar-sub">My Properties</p>
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
    </div>
  );
}

export default BoardingDashboard;

