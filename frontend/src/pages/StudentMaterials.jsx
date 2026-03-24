import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { studentNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

function StudentMaterials() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => secureLogout()
    );
  };

  return (
    <>
      <DashboardLayout
        role="Student"
        sidebarBrand="UniHub Student"
        sidebarSub="Course Materials"
        navItems={studentNavItems}
        activePath="/student/materials"
        userName={studentName}
        userAvatar={avatarSrc}
        title="Course Materials"
        subtitleText={`Recently shared content for ${studentName}.`}
        onLogout={handleLogout}
      >
        <div className="glass-card p-6 md:p-10 rounded-2xl w-full text-center mt-10">
            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/40 text-primary-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📚</div>
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">No Materials Yet</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Your teachers haven't uploaded any study materials for your enrolled courses yet. Please check back later.</p>
        </div>
      </DashboardLayout>
      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default StudentMaterials;
