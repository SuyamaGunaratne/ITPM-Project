import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherStudents from './pages/TeacherStudents';
import TeacherMaterials from './pages/TeacherMaterials';
import TeacherPublishQuiz from './pages/TeacherPublishQuiz';
import TeacherProfileEdit from './pages/TeacherProfileEdit';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfileEdit from './pages/StudentProfileEdit';
import StudentQuizzes from './pages/StudentQuizzes';
import StudentMaterials from './pages/StudentMaterials';
import StudentCommunity from './pages/StudentCommunity';
import StudentSupport from './pages/StudentSupport';
import AdminDashboard from './pages/AdminDashboard';
import BoardingDashboard from './pages/BoardingDashboard';
import BoardingOwnerRegistration from './pages/BoardingOwnerRegistration';
import BoardingRegistrationRequests from './pages/AdminPages/BoardingRegistrationRequests';
import PostRequests from './pages/AdminPages/PostRequests';
import StudentManagement from './pages/AdminPages/StudentManagement';
import TeacherManagement from './pages/AdminPages/TeacherManagement';
import BoardingOwnerManagement from './pages/AdminPages/BoardingOwnerManagement';
import AdminSupportRequests from './pages/AdminPages/AdminSupportRequests';
import GlobalHeader from './components/GlobalHeader';
import './App.css';

function App() {
  const path = window.location.pathname;

  const renderPage = () => {
    if (path === '/login') return <LoginPage />;
    if (path === '/boarding/register') return <BoardingOwnerRegistration />;
    if (path === '/admin/boarding-registrations') return <BoardingRegistrationRequests />;

    if (path === '/teacher/dashboard') return <TeacherDashboard />;
    if (path === '/teacher/students') return <TeacherStudents />;
    if (path === '/teacher/materials') return <TeacherMaterials />;
    if (path === '/teacher/quizzes/publish') return <TeacherPublishQuiz />;
    if (path === '/teacher/profile/edit') return <TeacherProfileEdit />;

    if (path === '/student/dashboard') return <StudentDashboard />;
    if (path === '/student/profile/edit') return <StudentProfileEdit />;
    if (path === '/student/quizzes') return <StudentQuizzes />;
    if (path === '/student/materials') return <StudentMaterials />;
    if (path === '/student/community') return <StudentCommunity />;
    if (path === '/student/boardings') return <StudentBoardings />;
    if (path === '/student/support') return <StudentSupport />;

    if (path === '/admin/dashboard') return <AdminDashboard />;
    if (path === '/admin/post-requests') return <PostRequests />;
    if (path === '/admin/students') return <StudentManagement />;
    if (path === '/admin/teachers') return <TeacherManagement />;
    if (path === '/admin/boarding-owners') return <BoardingOwnerManagement />;
    if (path === '/admin/support-requests') return <AdminSupportRequests />;
    if (path === '/boarding/dashboard') return <BoardingDashboard />;

    return <HomePage />;
  };

  const showNavFor = ['/', '/login', '/boarding/register'];
  const showNav = showNavFor.includes(path);

  return (
    <>
      {showNav && <GlobalHeader showNav={showNav} />}
      {renderPage()}
    </>
  );
}

export default App;
