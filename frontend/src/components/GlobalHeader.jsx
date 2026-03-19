import '../styles/HomePage.css';

export default function GlobalHeader({ showNav = false }) {
  return (
    <header className="navbar global-navbar">
      <div className="navbar-left">
        <img src="/logo.png" alt="UniHub Logo" className="navbar-logo" />
        <div className="navbar-title-group">
          <span className="navbar-title">UniHub LMS</span>
          <span className="navbar-tagline">Learn • Connect • Grow</span>
        </div>
      </div>
      {showNav && (
        <nav className="navbar-links">
          <a className="navbar-link" href="/" title="Home">
            Home
          </a>
          <a className="navbar-link" href="/login" title="Login">
            Login
          </a>
          <a className="navbar-link" href="/boarding/register" title="Register Boarding Owner">
            Register
          </a>
        </nav>
      )}
    </header>
  );
}
