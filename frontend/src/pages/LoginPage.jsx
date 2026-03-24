import { useState } from 'react';
import useNotification from '../hooks/useNotification';
import AuthLayout from '../components/AuthLayout';

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
    <>
      <AuthLayout 
        title="Welcome Back!" 
        subtitle="Sign in to your UniHub LMS account to continue your learning journey."
      >
        <div className="mb-10">
          <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">Sign in</h1>
          <p className="text-slate-500 dark:text-slate-400">Enter your credentials to access your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@university.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="remember" className="text-slate-600 dark:text-slate-400">Remember me</label>
            </div>
            <a href="#forgot" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-lg"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account? <a href="/boarding/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">Register here</a>
        </p>
      </AuthLayout>

      <NotificationPortal />
    </>
  );
}

export default LoginPage;
