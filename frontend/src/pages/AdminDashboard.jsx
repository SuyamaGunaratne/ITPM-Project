import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';

function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    boardingOwners: 0,
    boardingOwnerRequests: 0,
    communityApprovalRequests: 0,
    openSupportRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [user] = useState(() => {
    const stored = window.localStorage.getItem('unihub_user');
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
  });

  const token = user?.token || null;
  const adminName = user?.fullName || user?.name || 'Admin';

  const apiHeaders = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/stats/admin-dashboard', {
          headers: apiHeaders,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics');
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  const handleBoardingRequests = () => {
    window.location.href = '/admin/boarding-registrations';
  };

  return (
    <AdminLayout title="Admin Dashboard" subtitle={`Welcome back, ${adminName}`} activePath="/admin/dashboard">
      <div className="dashboard-content">
        {error && (
          <div className="p-4 mb-6 text-sm font-medium text-red-800 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400">
            ⚠ {error}
          </div>
        )}

        <div className="welcome-card mb-8">
          <h2>Welcome to Admin Panel</h2>
          <p>Manage registration requests, approve/reject boarding owner applications, and oversee system operations.</p>
        </div>

        {/* User Statistics Section */}
        <div className="mb-8">
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-4">User Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Students Count */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Students</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '...' : stats.students}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍🎓</span>
                </div>
              </div>
            </div>

            {/* Teachers Count */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Teachers</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '...' : stats.teachers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍🏫</span>
                </div>
              </div>
            </div>

            {/* Boarding Owners Count */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Boarding Owners</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '...' : stats.boardingOwners}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Statistics Section */}
        <div className="mb-8">
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-4">Pending Requests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Boarding Owner Requests */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Boarding Owner Requests</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '...' : stats.boardingOwnerRequests}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pending registration approvals</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              {stats.boardingOwnerRequests > 0 && (
                <button
                  className="mt-4 w-full btn-primary py-2 px-4 text-sm hover:shadow-lg transition-shadow"
                  onClick={handleBoardingRequests}
                >
                  Review Requests →
                </button>
              )}
            </div>

            {/* Community Approval Requests */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Community Approval Requests</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '...' : stats.communityApprovalRequests}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pending post approvals</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
              </div>
              {stats.communityApprovalRequests > 0 && (
                <button
                  className="mt-4 w-full btn-secondary py-2 px-4 text-sm hover:shadow-lg transition-shadow"
                  onClick={() => window.location.href = '/admin/post-requests'}
                >
                  Review Posts →
                </button>
              )}
            </div>

            {/* Support Requests */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Support Requests</h3>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {loading ? '...' : stats.openSupportRequests}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Open student support tickets</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🆘</span>
                </div>
              </div>
              {stats.openSupportRequests > 0 && (
                <button
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:shadow-lg transition-all"
                  onClick={() => window.location.href = '/admin/support-requests'}
                >
                  View Support →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
