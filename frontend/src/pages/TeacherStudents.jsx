import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { teacherNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

function TeacherStudents() {
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
    showConfirm('Logout Confirmation', 'Are you sure you want to logout?', () => secureLogout());
  };

  return (
    <>
      <DashboardLayout
        role="Teacher"
        sidebarBrand="UniHub Teacher"
        sidebarSub="Students"
        navItems={teacherNavItems}
        activePath="/teacher/students"
        userName={teacherName}
        userAvatar={avatarSrc}
        title="View Students"
        subtitleText={`Hello ${teacherName}. Here is your student list.`}
        onLogout={handleLogout}
      >
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Registered Students</h2>
            <button className="btn-outline py-2 px-4 text-sm font-semibold">Export CSV</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm">
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700">Name</th>
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700">Student ID</th>
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700">Course</th>
                  <th className="py-4 px-6 font-semibold border-b border-slate-200 dark:border-slate-700">Batch</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Amaya Perera</td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">STU-1023</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">IT</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">Y3S2</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Nimal Silva</td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">STU-1188</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">SE</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">Y2S1</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">Kavindu Fernando</td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono">STU-1312</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">CS</td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">Y1S2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default TeacherStudents;
