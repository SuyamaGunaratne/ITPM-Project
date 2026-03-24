import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

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

    if (!user || user.role !== 'admin') {
      window.location.href = '/login';
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
    } else if (role === 'teacher') {
      payload.teacherId = form.teacherId;
      payload.department = form.department;
      payload.qualifications = form.qualifications;
      payload.subjects = form.subjects ? form.subjects.split(',').map((s) => s.trim()).filter(Boolean) : [];
    } else if (role === 'boardingOwner') {
      payload.ownerNIC = form.ownerNIC;
      payload.businessName = form.businessName;
      payload.boardingAddress = form.boardingAddress;
      payload.city = form.city;
      payload.district = form.district;
      payload.monthlyRent = form.monthlyRent ? Number(form.monthlyRent) : undefined;
      payload.availableRooms = form.availableRooms ? Number(form.availableRooms) : undefined;
      payload.description = form.description;
      payload.facilities = form.facilities ? form.facilities.split(',').map((f) => f.trim()).filter(Boolean) : [];
      payload.isApproved = !!form.isApproved;
    }

    try {
      setSaving(true);
      const url = editing ? `http://localhost:5000/api/admin/users/${editing._id}` : 'http://localhost:5000/api/admin/users';
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
      <div className="flex flex-col gap-6">
        {error && <div className="p-4 text-sm font-medium text-red-800 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400">⚠ {error}</div>}
        {success && <div className="p-4 text-sm font-medium text-green-800 bg-green-100 rounded-xl dark:bg-green-900/30 dark:text-green-400">✓ {success}</div>}

        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">All {roleLabel}s</h2>
          <button className="btn-primary py-2 px-6 shadow-md shadow-primary-500/20 text-sm" onClick={openCreateModal}>
            + Add {roleLabel}
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4 py-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl text-center mt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No {roleLabel.toLowerCase()}s found.</h3>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white">
                <tr>
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700">Name</th>
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700">Email</th>
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700">{roleLabel} Info</th>
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-slate-100 dark:divide-slate-800/50">
                {users.map((user) => {
                  const extraInfo =
                    role === 'student' ? `${user.studentId || '—'} / ${user.course || '—'}`
                      : role === 'teacher' ? `${user.teacherId || '—'} / ${user.department || '—'}`
                      : role === 'boardingOwner' ? `${user.ownerNIC || '—'} / ${user.businessName || '—'}`
                      : '—';

                  return (
                    <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900 dark:text-white">{user.fullName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{user.email}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{extraInfo}</td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2" onClick={() => openEditModal(user)}>
                          Edit
                        </button>
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors" onClick={() => handleDelete(user)}>
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
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={closeModal}>
            <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-dark-border m-auto relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{editing ? `Edit ${roleLabel}` : `Add ${roleLabel}`}</h2>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onClick={closeModal}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                    <input type="text" value={form.fullName} onChange={(e) => handleFormChange('fullName', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                    <input type="email" value={form.email} onChange={(e) => handleFormChange('email', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password {editing && <span className="font-normal text-slate-400">(leave blank to keep)</span>}</label>
                    <input type="text" value={form.password} onChange={(e) => handleFormChange('password', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                  </div>
                </div>

                {role === 'student' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Student ID</label>
                      <input value={form.studentId} onChange={(e) => handleFormChange('studentId', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Course</label>
                      <input value={form.course} onChange={(e) => handleFormChange('course', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Batch</label>
                      <input value={form.batch} onChange={(e) => handleFormChange('batch', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Year</label>
                      <input type="number" value={form.year} onChange={(e) => handleFormChange('year', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                  </div>
                )}

                {role === 'teacher' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Teacher ID</label>
                      <input value={form.teacherId} onChange={(e) => handleFormChange('teacherId', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Department</label>
                      <input value={form.department} onChange={(e) => handleFormChange('department', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Qualifications</label>
                      <input value={form.qualifications} onChange={(e) => handleFormChange('qualifications', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Subjects (comma-separated)</label>
                      <input value={form.subjects} onChange={(e) => handleFormChange('subjects', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                  </div>
                )}

                {role === 'boardingOwner' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Owner NIC</label>
                      <input value={form.ownerNIC} onChange={(e) => handleFormChange('ownerNIC', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Business Name</label>
                      <input value={form.businessName} onChange={(e) => handleFormChange('businessName', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Boarding Address</label>
                      <input value={form.boardingAddress} onChange={(e) => handleFormChange('boardingAddress', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">City</label>
                      <input value={form.city} onChange={(e) => handleFormChange('city', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">District</label>
                      <input value={form.district} onChange={(e) => handleFormChange('district', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Rent</label>
                      <input type="number" value={form.monthlyRent} onChange={(e) => handleFormChange('monthlyRent', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Available Rooms</label>
                      <input type="number" value={form.availableRooms} onChange={(e) => handleFormChange('availableRooms', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                      <textarea value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all resize-none" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Facilities (comma-separated)</label>
                      <input value={form.facilities} onChange={(e) => handleFormChange('facilities', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all" />
                    </div>
                    <div className="space-y-2 md:col-span-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                      <input type="checkbox" checked={!!form.isApproved} onChange={(e) => handleFormChange('isApproved', e.target.checked)} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600" id="isApproved" />
                      <label htmlFor="isApproved" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Approved (Show in listings)</label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button className="btn-outline py-2.5 px-6" onClick={closeModal} disabled={saving}>Cancel</button>
                <button className="btn-primary py-2.5 px-8 shadow-md shadow-primary-500/20" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default UserManagement;
