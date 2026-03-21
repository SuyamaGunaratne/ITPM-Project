import { useState, useCallback, useRef } from 'react';
import '../styles/HomePage.css';
import '../styles/Notifications.css';

/* ─────────────────────────────────────────────
   Inline notification hook — no separate file
   ───────────────────────────────────────────── */
const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

function useNotification() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, out: true } : t))
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 420);
  }, []);

  const showNotification = useCallback(
    (type = 'info', title = '', message = '') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [{ id, type, title, message, out: false }, ...prev]);
      timers.current[id] = setTimeout(() => dismiss(id), 3200);
      return id;
    },
    [dismiss]
  );

  const pauseTimer = useCallback((id) => {
    clearTimeout(timers.current[id]);
  }, []);

  const resumeTimer = useCallback(
    (id) => {
      timers.current[id] = setTimeout(() => dismiss(id), 1800);
    },
    [dismiss]
  );

  const NotificationPortal = useCallback(
    () => (
      <div id="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={[
              'login-popup',
              `login-popup-${toast.type}`,
              toast.out ? 'popup-out' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => dismiss(toast.id)}
            onMouseEnter={() => pauseTimer(toast.id)}
            onMouseLeave={() => resumeTimer(toast.id)}
          >
            <span className="login-popup-icon" aria-hidden="true">
              {ICONS[toast.type]}
            </span>
            <div className="login-popup-body">
              {toast.title && (
                <div className="login-popup-title">{toast.title}</div>
              )}
              {toast.message && (
                <div className="login-popup-msg">{toast.message}</div>
              )}
            </div>
            <button
              className="login-popup-close"
              aria-label="Dismiss"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(toast.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    ),
    [toasts, dismiss, pauseTimer, resumeTimer]
  );

  return { showNotification, NotificationPortal };
}

/* ─────────────────────────────────────────────
   LoginPage
   ───────────────────────────────────────────── */
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { showNotification, NotificationPortal } = useNotification();

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
        showNotification('error', 'Login failed', data.message || 'Invalid credentials. Try again.');
        return;
      }

      window.localStorage.setItem('unihub_user', JSON.stringify(data));

      let target = '/';
      let roleLabel = 'User';
      switch (data.role) {
        case 'teacher':       target = '/teacher/dashboard';  roleLabel = 'Teacher';        break;
        case 'student':       target = '/student/dashboard';  roleLabel = 'Student';        break;
        case 'admin':         target = '/admin/dashboard';    roleLabel = 'Admin';          break;
        case 'boardingOwner': target = '/boarding/dashboard'; roleLabel = 'Boarding Owner'; break;
        default:              target = '/';
      }

      showNotification('success', `Welcome back, ${data.name || roleLabel}!`, 'Redirecting to your dashboard…');
      setTimeout(() => { window.location.href = target; }, 1400);
    } catch {
      showNotification('error', 'Server unreachable', 'Please check your connection and try again.');
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
              <a href="#forgot" className="login-link">Forgot your password?</a>
              <span className="divider-dot">•</span>
              <a href="#help" className="login-link">Need help?</a>
            </div>
          </form>
        </section>
      </main>

      {/* Toast notifications render here, fixed top-right */}
      <NotificationPortal />

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

