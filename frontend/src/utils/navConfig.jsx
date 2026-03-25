export const studentNavItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: <span className="text-xl">📊</span> },
  { label: 'Quizzes', path: '/student/quizzes', icon: <span className="text-xl">📝</span> },
  { label: 'Course Materials', path: '/student/materials', icon: <span className="text-xl">📚</span> },
  { label: 'Community', path: '/student/community', icon: <span className="text-xl">💬</span> },
  { label: 'Boardings', path: '/student/boardings', icon: <span className="text-xl">🏠</span> },
  { label: 'Support', path: '/student/support', icon: <span className="text-xl">🆘</span> },
  { label: 'Profile', path: '/student/profile/edit', icon: <span className="text-xl">⚙️</span> },
];

export const teacherNavItems = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: <span className="text-xl">📊</span> },
  { label: 'View Students', path: '/teacher/students', icon: <span className="text-xl">👨‍🎓</span> },
  { label: 'Study Materials', path: '/teacher/materials', icon: <span className="text-xl">📚</span> },
  { label: 'Publish Quiz', path: '/teacher/quizzes/publish', icon: <span className="text-xl">📝</span> },
  { label: 'Profile', path: '/teacher/profile/edit', icon: <span className="text-xl">⚙️</span> },
];

export const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <span className="text-xl">📊</span> },
  { label: 'Boarding Owner Requests', path: '/admin/boarding-registrations', icon: <span className="text-xl">📋</span> },
  { label: 'Student Management', path: '/admin/students', icon: <span className="text-xl">👨‍🎓</span> },
  { label: 'Teacher Management', path: '/admin/teachers', icon: <span className="text-xl">👨‍🏫</span> },
  { label: 'Boarding Owner Management', path: '/admin/boarding-owners', icon: <span className="text-xl">🏠</span> },
  { label: 'Community Post Approvals', path: '/admin/post-requests', icon: <span className="text-xl">💬</span> },
  { label: 'Support Requests', path: '/admin/support-requests', icon: <span className="text-xl">🆘</span> },
];

export const boardingOwnerNavItems = [
  { label: 'Dashboard', path: '/boarding/dashboard', icon: <span className="text-xl">📊</span> },
  { label: 'Boarding Properties', path: '/boarding/properties', icon: <span className="text-xl">🏠</span> },
  { label: 'Messages', path: '/boarding/messages', icon: <span className="text-xl">💬</span> },
];
