import { useEffect } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { boardingOwnerNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

function BoardingDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const ownerName = user?.name || user?.fullName || 'Boarding Owner';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm('Logout Confirmation', 'Are you sure you want to logout?', () => secureLogout());
  };

  return (
    <>
      <DashboardLayout
        role="Boarding Owner"
        sidebarBrand="UniHub Boarding"
        sidebarSub="My Properties"
        navItems={boardingOwnerNavItems}
        activePath="/boarding/dashboard"
        userName={ownerName}
        userAvatar={avatarSrc}
        title="Boarding Owner Dashboard"
        subtitleText={`Welcome back, ${ownerName}.`}
        onLogout={handleLogout}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary-500">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">Total Boardings</h3>
            <p className="text-3xl font-heading font-bold text-slate-900 dark:text-white">0</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-green-500">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">Active Tenants</h3>
            <p className="text-3xl font-heading font-bold text-slate-900 dark:text-white">0</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-yellow-500">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">Pending Requests</h3>
            <p className="text-3xl font-heading font-bold text-slate-900 dark:text-white">0</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">My Properties</h2>
            <button className="btn-primary py-2 px-4 text-sm font-semibold shadow-md shadow-primary-500/20">Add Property</button>
          </div>
          <div className="text-center py-10">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No properties yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Add your first boarding property to start receiving requests.</p>
          </div>
        </div>
      </DashboardLayout>

      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default BoardingDashboard;
