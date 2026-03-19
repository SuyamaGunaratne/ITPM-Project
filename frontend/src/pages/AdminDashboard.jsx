import AdminLayout from '../components/AdminLayout';

function AdminDashboard() {
  return (
    <AdminLayout title="Admin Dashboard" subtitle="Welcome back," activePath="/admin/dashboard">
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to Admin Panel</h2>
          <p>Manage registration requests, approve/reject boarding owner applications, and oversee system operations.</p>
          <button className="btn-primary" onClick={() => (window.location.href = '/admin/boarding-registrations')}>
            View Boarding Owner Requests →
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;

