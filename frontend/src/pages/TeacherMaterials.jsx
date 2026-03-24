import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { teacherNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

function TeacherMaterials() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const teacherName = user?.fullName || user?.name || 'Teacher';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      () => secureLogout()
    );
  };

  return (
    <>
      <DashboardLayout
        role="Teacher"
        sidebarBrand="UniHub Teacher"
        sidebarSub="Materials"
        navItems={teacherNavItems}
        activePath="/teacher/materials"
        userName={teacherName}
        userAvatar={avatarSrc}
        title="Study Materials"
        subtitleText={`Manage lecture notes and files for ${teacherName}.`}
        onLogout={handleLogout}
      >
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Uploaded Materials</h2>
            <button className="btn-primary py-2.5 px-6 shadow-md shadow-primary-500/20 text-sm">
              Upload New Variable
            </button>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Week 06 – Software Architecture Slides', type: 'PDF', time: 'Uploaded 2 days ago' },
              { title: 'Lab Sheet – REST APIs', type: 'DOCX', time: 'Uploaded 1 week ago' },
              { title: 'Reading List – Distributed Systems', type: 'Link', time: 'Uploaded 2 weeks ago' }
            ].map((mat, i) => (
              <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">📄</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{mat.title}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{mat.type} &bull; {mat.time}</p>
                  </div>
                </div>
                <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default TeacherMaterials;
