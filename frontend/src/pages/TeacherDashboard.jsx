import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import { getQuizzes } from '../utils/quizApi';

const teacherNavItems = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: <span className="text-xl">📊</span> },
  { label: 'View Students', path: '/teacher/students', icon: <span className="text-xl">👨‍🎓</span> },
  { label: 'Study Materials', path: '/teacher/materials', icon: <span className="text-xl">📚</span> },
  { label: 'Publish Quiz', path: '/teacher/quizzes/publish', icon: <span className="text-xl">📝</span> },
  { label: 'Profile', path: '/teacher/profile/edit', icon: <span className="text-xl">⚙️</span> },
];

function TeacherDashboard() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const teacherName = user?.fullName || user?.name || 'Teacher';
  const teacherDepartment = user?.department || 'Faculty of Computing';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const [stats, setStats] = useState({
    activeCourses: '...',
    enrolledStudents: '...',
    pendingQuizzes: '...',
  });
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const fetchDashboardData = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const statsRes = await fetch(`http://localhost:5000/api/stats/teacher-dashboard?teacherId=${user._id}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            activeCourses: statsData.activeCourses ?? 0,
            enrolledStudents: statsData.enrolledStudents ?? 0,
            pendingQuizzes: statsData.pendingQuizzes ?? 0,
          });
        }

        const quizData = await getQuizzes({ teacher: user._id });
        setQuizzes(quizData || []);
      } catch (err) {
        console.error("Error fetching teacher dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?._id]);

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
        role="Teacher"
        sidebarBrand="UniHub Teacher"
        sidebarSub={teacherDepartment}
        navItems={teacherNavItems}
        activePath="/teacher/dashboard"
        userName={teacherName}
        userAvatar={avatarSrc}
        title="Dashboard"
        subtitleText={`Welcome back, ${teacherName}. Here is an overview of your classes.`}
        onLogout={handleLogout}
      >
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-4 border-t-primary-500">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Active Courses</h3>
            <p className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-2">{stats.activeCourses}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Courses currently running this semester.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-4 border-t-accent-500">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Enrolled Students</h3>
            <p className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-2">{stats.enrolledStudents}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total students across all your courses.</p>
          </div>
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-t-4 border-t-green-500">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Published Quizzes</h3>
            <p className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-2">{stats.pendingQuizzes}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quizzes you have published for students.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Materials Panel */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Recent Study Materials</h2>
              <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline" onClick={() => window.location.href='/teacher/materials'}>View All</button>
            </div>
            <ul className="space-y-3">
              {['Week 05 – Algorithms Lecture Slides', 'Assignment 02 – Data Structures', 'Reading List – Research Methods'].map((mat, i) => (
                <li key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">📄</div>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{mat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quizzes Panel */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Your Published Quizzes</h2>
              <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline" onClick={() => window.location.href='/teacher/quizzes/publish'}>Publish New</button>
            </div>
            <ul className="space-y-3">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                </div>
              ) : quizzes.length > 0 ? (
                quizzes.slice(0, 5).map(quiz => (
                  <li key={quiz._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <div className="flex items-center gap-3 w-full pr-4">
                      <div className="p-2 bg-accent-50 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 rounded-lg">📝</div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">{quiz.title} ({quiz.course})</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {quiz.dueDate ? `Due: ${new Date(quiz.dueDate).toLocaleDateString()}` : 'No due date'}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-center py-6">
                  <span className="block text-2xl mb-2">📭</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">No quizzes published yet.</span>
                </li>
              )}
            </ul>
          </div>
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

export default TeacherDashboard;
