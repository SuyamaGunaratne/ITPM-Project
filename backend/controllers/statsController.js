const User = require('../models/User');
const Quiz = require('../models/Quiz');
const BoardingOwnerRegistration = require('../models/BoardingOwnerRegistration');
const PostRequest = require('../models/PostRequest');
const Support = require('../models/Support');

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

    // count quizzes for this teacher if teacher ID is provided, otherwise total quizzes
    const teacherId = req.query.teacherId;
    const quizFilter = teacherId ? { teacher: teacherId } : {};
    const quizCount = await Quiz.countDocuments(quizFilter);

    return res.json({
      activeCourses: courseNames.length,
      enrolledStudents: studentCount,
      pendingQuizzes: quizCount, 
    });
  } catch (err) {
    console.error('Error getting teacher dashboard stats:', err);
    return res.status(500).json({ message: 'Unable to retrieve dashboard statistics' });
  }
};

// admin dashboard statistics
exports.getAdminDashboardStats = async (req, res) => {
  try {
    // Count users by role
    const studentCount = await User.countDocuments({ role: 'student' });
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const boardingOwnerCount = await User.countDocuments({ role: 'boardingOwner' });

    // Count boarding owner registration requests
    const boardingOwnerRequestsCount = await BoardingOwnerRegistration.countDocuments();

    // Count pending community post requests
    const communityApprovalRequestsCount = await PostRequest.countDocuments({ status: 'pending' });

    // Count open support requests
    const openSupportRequestsCount = await Support.countDocuments({ status: 'open' });

    return res.json({
      students: studentCount,
      teachers: teacherCount,
      boardingOwners: boardingOwnerCount,
      boardingOwnerRequests: boardingOwnerRequestsCount,
      communityApprovalRequests: communityApprovalRequestsCount,
      openSupportRequests: openSupportRequestsCount,
    });
  } catch (err) {
    console.error('Error getting admin dashboard stats:', err);
    return res.status(500).json({ message: 'Unable to retrieve admin dashboard statistics' });
  }
};
