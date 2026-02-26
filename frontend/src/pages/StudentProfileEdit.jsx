import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';

function StudentProfileEdit() {
  const { modal, closeModal, handleConfirm, showConfirm, showSuccess, showError } = useModal();

  const stored = window.localStorage.getItem('unihub_user');
  const storedUser = stored ? JSON.parse(stored) : null;
  const token = storedUser?.token;

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    course: '',
    batch: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(
    storedUser?.profileImage || '/images/teacher-avatar.jpg'
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

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
          course: data.course || '',
          batch: data.batch || '',
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
        formData.append('course', form.course);
        formData.append('batch', form.batch);
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
              window.location.href = '/student/dashboard';
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

  return (
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Student Panel</div>
            <p className="sidebar-sub">Profile Settings</p>
          </div>
          <nav className="sidebar-nav">
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/dashboard')}
            >
              <span className="sidebar-bullet" />
              Dashboard
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/quizzes')}
            >
              <span className="sidebar-bullet" />
              Quizzes
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/materials')}
            >
              <span className="sidebar-bullet" />
              Course Materials
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/community')}
            >
              <span className="sidebar-bullet" />
              Community
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/boardings')}
            >
              <span className="sidebar-bullet" />
              Boardings
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
                Update your student information and profile picture.
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
                alt="Student profile"
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
                <label htmlFor="course">Course</label>
                <input
                  id="course"
                  type="text"
                  value={form.course}
                  onChange={handleChange}
                  placeholder="e.g. BSc in IT"
                />
              </div>

              <div className="form-group">
                <label htmlFor="batch">Batch</label>
                <input
                  id="batch"
                  type="text"
                  value={form.batch}
                  onChange={handleChange}
                  placeholder="e.g. Y3S2"
                />
              </div>

              <div className="teacher-profile-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => (window.location.href = '/student/dashboard')}
                >
                  Cancel
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

export default StudentProfileEdit;

