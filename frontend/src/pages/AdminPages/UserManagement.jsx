import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import '../../styles/Management.css';

const roleLabels = {
  student: 'Student',
  teacher: 'Teacher',
  boardingOwner: 'Boarding Owner',
};

const activePaths = {
  student: '/admin/students',
  teacher: '/admin/teachers',
  boardingOwner: '/admin/boarding-owners',
};

const buildInitialForm = (role) => {
  const base = {
    fullName: '',
    email: '',
    password: '',
    role,
  };

  if (role === 'student') {
    return {
      ...base,
      studentId: '',
      course: '',
      batch: '',
      year: '',
    };
  }

  if (role === 'teacher') {
    return {
      ...base,
      teacherId: '',
      department: '',
      qualifications: '',
      subjects: '',
    };
  }

  if (role === 'boardingOwner') {
    return {
      ...base,
      ownerNIC: '',
      businessName: '',
      boardingAddress: '',
      city: '',
      district: '',
      monthlyRent: '',
      availableRooms: '',
      description: '',
      facilities: '',
      isApproved: true,
    };
  }

  return base;
};

const getAuthToken = () => {
  const stored = localStorage.getItem('unihub_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored).token;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

function UserManagement({ role }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(() => buildInitialForm(role));
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const roleLabel = roleLabels[role] || 'User';

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const token = getAuthToken();
    if (!token) {
      setError('Please log in as an admin to access this page.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users?role=${role}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load users');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Unexpected error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('unihub_user');
    const user = stored ? JSON.parse(stored) : null;

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (user.role !== 'admin') {
      window.location.href = '/';
      return;
    }

    fetchUsers();
  }, [role]);

  const openCreateModal = () => {
    setEditing(null);
    setForm(buildInitialForm(role));
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const openEditModal = (user) => {
    setEditing(user);
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      role: user.role,
      studentId: user.studentId || '',
      course: user.course || '',
      batch: user.batch || '',
      year: user.year || '',
      teacherId: user.teacherId || '',
      department: user.department || '',
      qualifications: user.qualifications || '',
      subjects: Array.isArray(user.subjects) ? user.subjects.join(', ') : user.subjects || '',
      ownerNIC: user.ownerNIC || '',
      businessName: user.businessName || '',
      boardingAddress: user.boardingAddress || '',
      city: user.city || '',
      district: user.district || '',
      monthlyRent: user.monthlyRent ?? '',
      availableRooms: user.availableRooms ?? '',
      description: user.description || '',
      facilities: Array.isArray(user.facilities) ? user.facilities.join(', ') : user.facilities || '',
      isApproved: user.isApproved ?? true,
    });
    setModalOpen(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(buildInitialForm(role));
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    // If creating, require password
    if (!editing && !form.password.trim()) {
      setError('Password is required for new users.');
      return;
    }

    const payload = {
      fullName: form.fullName,
      email: form.email,
      role: form.role,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    if (role === 'student') {
      payload.studentId = form.studentId;
      payload.course = form.course;
      payload.batch = form.batch;
      payload.year = form.year ? Number(form.year) : undefined;
    }

    if (role === 'teacher') {
      payload.teacherId = form.teacherId;
      payload.department = form.department;
      payload.qualifications = form.qualifications;
      payload.subjects = form.subjects
        ? form.subjects.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (role === 'boardingOwner') {
      payload.ownerNIC = form.ownerNIC;
      payload.businessName = form.businessName;
      payload.boardingAddress = form.boardingAddress;
      payload.city = form.city;
      payload.district = form.district;
      payload.monthlyRent = form.monthlyRent ? Number(form.monthlyRent) : undefined;
      payload.availableRooms = form.availableRooms ? Number(form.availableRooms) : undefined;
      payload.description = form.description;
      payload.facilities = form.facilities
        ? form.facilities.split(',').map((f) => f.trim()).filter(Boolean)
        : [];
      payload.isApproved = !!form.isApproved;
    }

    try {
      setSaving(true);
      const url = editing
        ? `http://localhost:5000/api/admin/users/${editing._id}`
        : 'http://localhost:5000/api/admin/users';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save user');
      }

      setSuccess(editing ? 'User updated successfully.' : 'User created successfully.');
      closeModal();
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.fullName}? This cannot be undone.`)) return;

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }
      setSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const activePath = activePaths[role] || '/admin/dashboard';

  return (
    <AdminLayout title={`${roleLabel} Management`} subtitle="Manage user accounts" activePath={activePath}>
      <div className="management-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

<div className="management-actions">
        <button className="btn-primary" onClick={openCreateModal}>
          + Add {roleLabel}
        </button>
      </div>

      {loading ? (
        <p>Loading {roleLabel.toLowerCase()}s…</p>
      ) : users.length === 0 ? (
        <p className="no-data">No {roleLabel.toLowerCase()}s found.</p>
      ) : (
        <div className="management-table-wrapper">
          <table className="management-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>{roleLabel} Info</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const extraInfo =
                  role === 'student'
                    ? `${user.studentId || '—'} / ${user.course || '—'}`
                    : role === 'teacher'
                    ? `${user.teacherId || '—'} / ${user.department || '—'}`
                    : role === 'boardingOwner'
                    ? `${user.ownerNIC || '—'} / ${user.businessName || '—'}`
                    : '—';

                return (
                  <tr key={user._id}>
                    <td>
                      <div className="table-name">{user.fullName}</div>
                      <div className="table-subtext">{user.role}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>{extraInfo}</td>
                    <td>{user.password || '—'}</td>
                    <td className="table-actions">
                      <button className="btn-edit" onClick={() => openEditModal(user)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(user)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editing ? `Edit ${roleLabel}` : `Add ${roleLabel}`}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => handleFormChange('fullName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Password {editing ? '(leave blank to keep)' : ''}</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                  />
                </div>

                {role === 'student' && (
                  <>
                    <div className="form-group">
                      <label>Student ID</label>
                      <input
                        value={form.studentId}
                        onChange={(e) => handleFormChange('studentId', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Course</label>
                      <input
                        value={form.course}
                        onChange={(e) => handleFormChange('course', e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Batch</label>
                        <input
                          value={form.batch}
                          onChange={(e) => handleFormChange('batch', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Year</label>
                        <input
                          type="number"
                          value={form.year}
                          onChange={(e) => handleFormChange('year', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {role === 'teacher' && (
                  <>
                    <div className="form-group">
                      <label>Teacher ID</label>
                      <input
                        value={form.teacherId}
                        onChange={(e) => handleFormChange('teacherId', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        value={form.department}
                        onChange={(e) => handleFormChange('department', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Qualifications</label>
                      <input
                        value={form.qualifications}
                        onChange={(e) => handleFormChange('qualifications', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subjects (comma-separated)</label>
                      <input
                        value={form.subjects}
                        onChange={(e) => handleFormChange('subjects', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {role === 'boardingOwner' && (
                  <>
                    <div className="form-group">
                      <label>Owner NIC</label>
                      <input
                        value={form.ownerNIC}
                        onChange={(e) => handleFormChange('ownerNIC', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Business Name</label>
                      <input
                        value={form.businessName}
                        onChange={(e) => handleFormChange('businessName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Boarding Address</label>
                      <input
                        value={form.boardingAddress}
                        onChange={(e) => handleFormChange('boardingAddress', e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          value={form.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>District</label>
                        <input
                          value={form.district}
                          onChange={(e) => handleFormChange('district', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Monthly Rent</label>
                        <input
                          type="number"
                          value={form.monthlyRent}
                          onChange={(e) => handleFormChange('monthlyRent', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Available Rooms</label>
                        <input
                          type="number"
                          value={form.availableRooms}
                          onChange={(e) => handleFormChange('availableRooms', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label>Facilities (comma-separated)</label>
                      <input
                        value={form.facilities}
                        onChange={(e) => handleFormChange('facilities', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={!!form.isApproved}
                          onChange={(e) => handleFormChange('isApproved', e.target.checked)}
                        />
                        {' '}Approved
                      </label>
                    </div>
                  </>
                )}

                <div className="action-buttons" style={{ marginTop: 20 }}>
                  <button
                    className="btn-approve"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button className="btn-close" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default UserManagement;
