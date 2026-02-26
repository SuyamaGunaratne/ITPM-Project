const User = require('../models/User');

// returns simple counts for homepage
exports.getGlobalStats = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const boardingOwnerCount = await User.countDocuments({ role: 'boardingOwner' });

    // count distinct non-empty course names that students have selected
    const courseNames = await User.distinct('course', { course: { $exists: true, $ne: '' } });
    const availableCourses = courseNames.length;

    return res.json({
      students: studentCount,
      teachers: teacherCount,
      boardingOwners: boardingOwnerCount,
      courses: availableCourses,
    });
  } catch (err) {
    console.error('Error getting global stats:', err);
    return res.status(500).json({ message: 'Unable to retrieve statistics' });
  }
};

// simple teacher dashboard stats (derived from user collection)
exports.getTeacherDashboardStats = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const courseNames = await User.distinct('course', { course: { $exists: true, $ne: '' } });

    return res.json({
      activeCourses: courseNames.length,
      enrolledStudents: studentCount,
      pendingQuizzes: 0, // placeholder until quiz model exists
    });
  } catch (err) {
    console.error('Error getting teacher dashboard stats:', err);
    return res.status(500).json({ message: 'Unable to retrieve dashboard statistics' });
  }
};
