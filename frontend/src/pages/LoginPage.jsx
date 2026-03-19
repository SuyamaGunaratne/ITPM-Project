import { useState } from 'react';
import '../styles/HomePage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    type: '', // 'success' | 'error'
    message: '',
    visible: false,
  });

  const showPopup = (type, message) => {
    setPopup({ type, message, visible: true });
    setTimeout(() => {
      setPopup((prev) => ({ ...prev, visible: false }));
    }, 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showPopup('error', data.message || 'Invalid login. Try again.');
        return;
      }

      window.localStorage.setItem('unihub_user', JSON.stringify(data));

      let target = '/';
      let roleLabel = 'User';
      switch (data.role) {
        case 'teacher':
          target = '/teacher/dashboard';
          roleLabel = 'Teacher';
          break;
        case 'student':
          target = '/student/dashboard';
          roleLabel = 'Student';
          break;
        case 'admin':
          target = '/admin/dashboard';
          roleLabel = 'Admin';
          break;
        case 'boardingOwner':
          target = '/boarding/dashboard';
          roleLabel = 'Boarding Owner';
          break;
        default:
          target = '/';
      }

      showPopup('success', `Welcome back, ${data.name || roleLabel}!`);
      setTimeout(() => {
        window.location.href = target;
      }, 1400);
    } catch {
      showPopup('error', 'Server unreachable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-root login-root">
      <main className="login-main">
        <section className="login-card">
          <div className="login-header">
            <h1>Login</h1>
            <p>Sign in to access your UniHub dashboard based on your role.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@university.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-actions">
              <button
                type="submit"
                className="btn-primary login-submit"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>

            <div className="login-meta">
              <a href="#forgot" className="login-link">
                Forgot your password?
              </a>
              <span className="divider-dot">•</span>
              <a href="#help" className="login-link">
                Need help?
              </a>
            </div>
          </form>
        </section>
      </main>

      {popup.visible && (
        <div
          className={`login-popup ${
            popup.type === 'success' ? 'login-popup-success' : 'login-popup-error'
          }`}
        >
          {popup.message}
        </div>
      )}

      <footer className="footer">
        <div>© {new Date().getFullYear()} UniHub LMS. All rights reserved.</div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy</a>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;

