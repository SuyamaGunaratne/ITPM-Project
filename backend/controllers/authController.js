const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const router = require('../routes/authRoutes');

const registerBoardingOwner = async (req, res) => {
  try {
    const { fullName, email, password, businessName, ownerNIC, boardingAddress, city, district, monthlyRent, availableRooms, description, facilities, images } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Email already exists' });

    const user = new User({
      fullName,
      email,
      password,
      role: 'boardingOwner',
      businessName,
      ownerNIC,
      boardingAddress,
      city,
      district,
      monthlyRent,
      availableRooms,
      description,
      facilities: facilities || [],
      images: images || [],
      isApproved: false
    });

    await user.save();
    res.status(201).json({ msg: 'Registration successful! Waiting for admin approval.' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Boarding owner must be approved
    if (user.role === 'boardingOwner' && !user.isApproved) {
      return res.status(403).json({ message: "Your account is pending admin approval" });
    }

    res.json({
      _id: user._id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// const forgotPassword = async (req, res) => {
//   const { email } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ msg: 'No account found with this email' });
//     }

//     // Secret includes current password hash → invalid after password change
//     const secret = process.env.RESET_PASSWORD_SECRET + user.password;

//     const resetToken = jwt.sign(
//       { id: user._id },
//       secret,
//       { expiresIn: '1h' }   // or 15m / 30m
//     );

//     const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

//     const html = `
//       <h2>Password Reset Request</h2>
//       <p>Click the link below to reset your password:</p>
//       <a href="${resetLink}">Reset Password</a>
//       <p>This link expires in 1 hour.</p>
//       <p>If you didn't request this, ignore this email.</p>
//     `;

//     await sendEmail(email, 'Reset Your Password', html);

//     res.json({ msg: 'Password reset link sent to your email' });
//   } catch (err) {
//     res.status(500).json({ msg: 'Error sending email' });
//   }
// };

// const resetPassword = async (req, res) => {
//   const { email, token, newPassword } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ msg: 'User not found' });

//     const secret = process.env.RESET_PASSWORD_SECRET + user.password;

//     // Verify token
//     const decoded = jwt.verify(token, secret);

//     if (decoded.id !== user._id.toString()) {
//       return res.status(400).json({ msg: 'Invalid token' });
//     }

//     // Token is valid → update password
//     user.password = newPassword;   // pre-save hook will hash it
//     await user.save();

//     res.json({ msg: 'Password reset successful. You can now log in.' });
//   } catch (err) {
//     if (err.name === 'TokenExpiredError') {
//       return res.status(400).json({ msg: 'Reset link has expired' });
//     }
//     res.status(400).json({ msg: 'Invalid or expired token' });
//   }
// };

module.exports = {
  registerBoardingOwner,
  login,
  forgotPassword,
  resetPassword
};
