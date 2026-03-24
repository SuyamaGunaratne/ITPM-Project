import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { teacherNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

function TeacherProfileEdit() {
  const { modal, closeModal, handleConfirm, showConfirm, showSuccess, showError } = useModal();

  const stored = window.localStorage.getItem('unihub_user');
  const storedUser = stored ? JSON.parse(stored) : null;
  const token = storedUser?.token;

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    department: '',
    qualifications: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(
    storedUser?.profileImage || '/images/teacher-avatar.jpg'
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const loadProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        setForm({
          fullName: data.fullName || '',
          email: data.email || '',
          department: data.department || '',
          qualifications: data.qualifications || '',
        });

        if (data.profileImage) setAvatarPreview(data.profileImage);

        window.localStorage.setItem('unihub_user', JSON.stringify({ ...storedUser, ...data }));
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, [token, storedUser]); // Added storedUser safely to deps

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setAvatarPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || saving) return;

    showConfirm(
      'Save Changes',
      'Are you sure you want to save these changes to your profile?',
      async () => {
        const formData = new FormData();
        formData.append('fullName', form.fullName);
        formData.append('email', form.email);
        formData.append('department', form.department);
        formData.append('qualifications', form.qualifications);
        if (file) formData.append('profileImage', file);

        try {
          setSaving(true);
          const res = await fetch('http://localhost:5000/api/users/me', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (!res.ok) {
            showError('Error', 'Failed to update profile. Please try again.');
            return;
          }

          const data = await res.json();
          window.localStorage.setItem('unihub_user', JSON.stringify({ ...storedUser, ...data }));
          
          showSuccess('Success!', 'Your profile has been updated successfully.', () => {
              window.location.href = '/teacher/dashboard';
          });
        } catch (err) {
          showError('Error', 'Failed to update profile. Please try again.');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleLogout = () => {
    showConfirm('Logout Confirmation', 'Are you sure you want to logout?', () => secureLogout());
  };

  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [id]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!token || passwordSaving) return;

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showError('Password Mismatch', 'New passwords do not match. Please try again.');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await fetch('http://localhost:5000/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showError('Error', data.message || 'Failed to update password. Please try again.');
        return;
      }

      showSuccess('Success!', 'Password updated successfully.', () => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      });
    } catch (err) {
      showError('Error', 'Failed to update password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <DashboardLayout
        role="Teacher"
        sidebarBrand="UniHub Teacher"
        sidebarSub="Profile Settings"
        navItems={teacherNavItems}
        activePath="/teacher/profile/edit"
        userName={form.fullName || 'Teacher'}
        userAvatar={avatarPreview}
        title="Edit Profile"
        subtitleText="Update your personal information, contact details and profile picture."
        onLogout={handleLogout}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-sm p-6 lg:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-start mb-10 pb-10 border-b border-slate-200 dark:border-slate-800">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 flex-shrink-0">
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <button 
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">Profile Picture</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed">Choose a professional photo to help students and colleagues recognize you across the platform.</p>
                <button 
                  type="button" 
                  onClick={() => setAvatarModalOpen(true)}
                  className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-lg"
                >
                  Change Picture
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    id="fullName" type="text" value={form.fullName} onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    id="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="your.email@university.lk"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="department" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Department</label>
                  <input
                    id="department" type="text" value={form.department} onChange={handleChange}
                    placeholder="e.g. Department of Computer Science"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="qualifications" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Qualifications</label>
                  <textarea
                    id="qualifications" rows="3" value={form.qualifications} onChange={handleChange}
                    placeholder="Your academic and professional qualifications"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all resize-y"
                  />
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
                <button
                  type="button"
                  className="btn-outline py-3 px-6"
                  onClick={() => (window.location.href = '/teacher/dashboard')}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-3 px-8 shadow-lg shadow-primary-500/30" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-sm p-6 lg:p-10">
            <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-6">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
                  <input
                    id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} required
                    className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    id="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <input
                    id="confirmNewPassword" type="password" value={passwordForm.confirmNewPassword} onChange={handlePasswordChange} required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button type="submit" className="btn-primary py-3 px-8 shadow-lg shadow-primary-500/30" disabled={passwordSaving}>
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>

      {avatarModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAvatarModalOpen(false)}>
          <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-3xl p-8 shadow-2xl transition-all border border-slate-200 dark:border-dark-border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2 text-center">Edit Profile Picture</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">Choose a clear photo that represents you nicely.</p>
            
            <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-50 mb-6 shadow-inner">
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            
            <label className="block w-full text-center py-3 px-4 bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-semibold rounded-xl cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors mb-4 border border-primary-100 dark:border-primary-800/50">
              <span>Choose Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            
            <button
              type="button"
              className="block w-full text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              onClick={() => setAvatarModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default TeacherProfileEdit;
