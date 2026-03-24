import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from './Modal';
import DashboardLayout from './DashboardLayout';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <span className="text-xl">📊</span> },
  { label: 'Boarding Owner Requests', path: '/admin/boarding-registrations', icon: <span className="text-xl">📋</span> },
  { label: 'Student Management', path: '/admin/students', icon: <span className="text-xl">👨‍🎓</span> },
  { label: 'Teacher Management', path: '/admin/teachers', icon: <span className="text-xl">👨‍🏫</span> },
  { label: 'Boarding Owner Management', path: '/admin/boarding-owners', icon: <span className="text-xl">🏠</span> },
  { label: 'Community Post Approvals', path: '/admin/post-requests', icon: <span className="text-xl">💬</span> },
  { label: 'Support Requests', path: '/admin/support-requests', icon: <span className="text-xl">🆘</span> },
];

function AdminLayout({ title, subtitle, activePath, children }) {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    if (!checkAuthAndPreventCaching()) return;
    setupBackButtonProtection();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const adminName = user?.name || 'Admin';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

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
    <>
      <DashboardLayout
        role="Administrator"
        sidebarBrand="UniHub Admin"
        sidebarSub="System Management"
        navItems={navItems}
        activePath={activePath}
        userName={adminName}
        userAvatar={avatarSrc}
        title={title}
        subtitleText={subtitle ? `${subtitle} ${adminName}` : ''}
        onLogout={handleLogout}
      >
        {/* Render children inside the layout wrapper. If the children use custom classes
            some might look unstyled, but we'll provide modern base styles or refactor them. */}
        <div className="w-full h-full bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border p-6 lg:p-10 mb-10 overflow-hidden relative">
          {children}
        </div>
      </DashboardLayout>

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
    </>
  );
}

export default AdminLayout;
