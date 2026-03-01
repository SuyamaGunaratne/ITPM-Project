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
import StudentBoardings from './pages/StudentBoardings';
import AdminDashboard from './pages/AdminDashboard';
import BoardingDashboard from './pages/BoardingDashboard';
import BoardingOwnerRegistration from './pages/BoardingOwnerRegistration';
import BoardingRegistrationRequests from './pages/AdminPages/BoardingRegistrationRequests';
import './App.css';

function App() {
  const path = window.location.pathname;

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

  if (path === '/admin/dashboard') return <AdminDashboard />;
  if (path === '/boarding/dashboard') return <BoardingDashboard />;

  return <HomePage />;
}

export default App;
