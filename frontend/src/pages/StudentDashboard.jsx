import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { getQuizzes } from '../utils/quizApi';

const studentNavItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
  { label: 'Quizzes', path: '/student/quizzes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg> },
  { label: 'Course Materials', path: '/student/materials', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
  { label: 'Community', path: '/student/community', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg> },
  { label: 'Boardings', path: '/student/boardings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
  { label: 'Profile', path: '/student/profile/edit', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
];

function StudentDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const fetchQuizzes = async () => {
      if (!user?.course) {
        setLoading(false);
        return;
      }
      try {
        const data = await getQuizzes({ course: user.course });
        setQuizzes(data || []);
      } catch (err) {
        console.error("Error fetching student quizzes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

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
    <DashboardLayout
      role="Student"
      sidebarBrand="UniHub Student"
      sidebarSub={user?.course || 'Dashboard'}
      navItems={studentNavItems}
      activePath="/student/dashboard"
      userName={studentName}
      userAvatar={avatarSrc}
      title="Overview"
      subtitleText="Welcome back! Here's a quick look at your courses."
      onLogout={handleLogout}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Materials */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 dark:bg-primary-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-6">Recent Course Materials</h2>
          
          <div className="space-y-4">
            {['Week 05 – Lecture Slides on Databases', 'Assignment 02 – Web Development', 'Reading List – Software Engineering'].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50 cursor-pointer" onClick={() => window.location.href = '/student/materials'}>
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex flex-shrink-0 items-center justify-center text-lg">📄</div>
                <div className="flex-1 font-medium text-slate-700 dark:text-slate-200">{item}</div>
                <div className="text-slate-400 transform group-hover:translate-x-1 transition-transform">→</div>
              </div>
            ))}
          </div>
          
          <button className="mt-6 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1" onClick={() => window.location.href = '/student/materials'}>
            View all materials <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Upcoming Quizzes */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-100 dark:bg-accent-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-6">Upcoming Quizzes</h2>
          
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
              </div>
            ) : quizzes.length > 0 ? (
              quizzes.slice(0, 5).map(quiz => (
                <div key={quiz._id} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm hover:border-primary-300 transition-colors cursor-pointer" onClick={() => window.location.href = `/student/quizzes`}>
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/50 text-accent-600 dark:text-accent-400 flex flex-shrink-0 items-center justify-center text-lg">📝</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{quiz.title}</p>
                    <p className="text-xs text-slate-500 font-medium">{quiz.course}</p>
                  </div>
                  <div className="flex flex-col items-end text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{quiz.dueDate ? new Date(quiz.dueDate).toLocaleDateString() : 'No date'}</span>
                    <span className="text-slate-400">Due</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎉</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">No quizzes available for your course yet.</p>
              </div>
            )}
          </div>
          
          <button className="mt-6 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1" onClick={() => window.location.href = '/student/quizzes'}>
            Go to Quizzes <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-6 glass-card rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 group" onClick={() => window.location.href = '/student/community'}>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 flex items-center justify-center text-xl transition-colors">💬</div>
              <span className="font-medium">Community Forum</span>
            </button>
            <button className="p-6 glass-card rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 group" onClick={() => window.location.href = '/student/boardings'}>
               <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 flex items-center justify-center text-xl transition-colors">🏠</div>
               <span className="font-medium">Find Boardings</span>
            </button>
            <button className="p-6 glass-card rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 group" onClick={() => window.location.href = '/student/materials'}>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 flex items-center justify-center text-xl transition-colors">📚</div>
              <span className="font-medium">Study Materials</span>
            </button>
            <button className="p-6 glass-card rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 group" onClick={() => window.location.href = '/student/profile/edit'}>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 flex items-center justify-center text-xl transition-colors">⚙️</div>
              <span className="font-medium">Edit Profile</span>
            </button>
          </div>
        </div>

      </div>
      
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
    </DashboardLayout>
  );
}

export default StudentDashboard;
