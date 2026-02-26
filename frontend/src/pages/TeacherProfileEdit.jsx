import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

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

        window.localStorage.setItem(
          'unihub_user',
          JSON.stringify({ ...storedUser, ...data })
        );
      } catch {
        // ignore
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
          window.localStorage.setItem(
            'unihub_user',
            JSON.stringify({ ...storedUser, ...data })
          );
          
          showSuccess(
            'Success!',
            'Your profile has been updated successfully.',
            () => {
              window.location.href = '/teacher/dashboard';
            }
          );
        } catch (err) {
          showError('Error', 'Failed to update profile. Please try again.');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => {
        secureLogout();
      }
    );
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
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      });
    } catch (err) {
      showError('Error', 'Failed to update password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Teacher Panel</div>
            <p className="sidebar-sub">Profile Settings</p>
          </div>
          <nav className="sidebar-nav">
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/dashboard')}
            >
              <span className="sidebar-bullet" />
              Dashboard
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/students')}
            >
              <span className="sidebar-bullet" />
              View Students
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/materials')}
            >
              <span className="sidebar-bullet" />
              Study Materials
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/teacher/quizzes/publish')}
            >
              <span className="sidebar-bullet" />
              Publish Quiz
            </button>
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" />
              Profile
            </button>
            <button className="sidebar-item" onClick={handleLogout}>
              <span className="sidebar-bullet" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="teacher-main">
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">Edit Profile</h1>
              <p className="teacher-subtitle">
                Update your personal information, contact details and profile
                picture.
              </p>
            </div>

            <button
              type="button"
              className="teacher-avatar-btn"
              onClick={() => setAvatarModalOpen(true)}
              title="Edit profile picture"
            >
              <img
                src={avatarPreview}
                alt="Teacher profile"
                className="teacher-avatar"
              />
            </button>
          </header>

          <section className="teacher-panel teacher-profile-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your.email@university.lk"
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  type="text"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="e.g. Department of Computer Science"
                />
              </div>

              <div className="form-group">
                <label htmlFor="qualifications">Qualifications</label>
                <textarea
                  id="qualifications"
                  rows="3"
                  value={form.qualifications}
                  onChange={handleChange}
                  placeholder="Your academic and professional qualifications"
                />
              </div>

              <div className="teacher-profile-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => (window.location.href = '/teacher/dashboard')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          <section className="teacher-panel teacher-profile-form" style={{ marginTop: '1rem' }}>
            <form onSubmit={handlePasswordSubmit}>
              <h2>Change Password</h2>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="teacher-profile-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>

      {avatarModalOpen && (
        <div
          className="avatar-modal-backdrop"
          onClick={() => setAvatarModalOpen(false)}
        >
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile Picture</h2>
            <p className="avatar-modal-text">
              Upload a clear photo of yourself. This will be shown on your
              dashboard and in course areas.
            </p>
            <div className="avatar-modal-preview">
              <img src={avatarPreview} alt="Preview" />
            </div>
            <label className="avatar-modal-upload">
              <span>Choose New Image</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            <div className="avatar-modal-actions">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setAvatarModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        onConfirm={handleConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        singleButton={modal.singleButton}
      />
    </div>
  );
}

export default TeacherProfileEdit;

