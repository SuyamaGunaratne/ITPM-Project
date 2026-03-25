const User = require('../models/User');

const buildUserResponse = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };

  if (obj.profileImageData && obj.profileImageContentType) {
    obj.profileImage = `data:${obj.profileImageContentType};base64,${Buffer.from(
      obj.profileImageData
    ).toString('base64')}`;
  } else {
    obj.profileImage = null;
  }

  delete obj.password;
  delete obj.profileImageData;
  delete obj.profileImageContentType;

  return obj;
};

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(buildUserResponse(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load profile' });
  }
};

// GET /api/users/boardings (approved boarding owner listings)
const listBoardings = async (req, res) => {
  try {
    const boardings = await User.find({ role: 'boardingOwner', isApproved: true });

    const toResponse = boardings.map((owner) => {
      const obj = owner.toObject();
      delete obj.password;
      delete obj.profileImageData;
      delete obj.profileImageContentType;
      if (owner.profileImageData && owner.profileImageContentType) {
        obj.profileImage = `data:${owner.profileImageContentType};base64,${Buffer.from(owner.profileImageData).toString('base64')}`;
      } else {
        obj.profileImage = null;
      }
      return obj;
    });

    return res.json(toResponse);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch boardings' });
  }
};

// PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      fullName,
      email,
      department,
      qualifications,
      course,
      batch,
      businessName,
      ownerNIC,
      boardingAddress,
      city,
      district,
      monthlyRent,
      availableRooms,
      description,
      facilities,
      images,
    } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (department !== undefined) user.department = department;
    if (qualifications !== undefined) user.qualifications = qualifications;
    if (course !== undefined) user.course = course;
    if (batch !== undefined) user.batch = batch;

    if (user.role === 'boardingOwner') {
      if (businessName !== undefined) user.businessName = businessName;
      if (ownerNIC !== undefined) user.ownerNIC = ownerNIC;
      if (boardingAddress !== undefined) user.boardingAddress = boardingAddress;
      if (city !== undefined) user.city = city;
      if (district !== undefined) user.district = district;
      if (monthlyRent !== undefined) user.monthlyRent = Number(monthlyRent) || 0;
      if (availableRooms !== undefined) user.availableRooms = Number(availableRooms) || 0;
      if (description !== undefined) user.description = description;

      if (facilities !== undefined) {
        if (Array.isArray(facilities)) {
          user.facilities = facilities;
        } else if (typeof facilities === 'string') {
          user.facilities = facilities
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }

      if (images !== undefined) {
        if (Array.isArray(images)) {
          user.images = images;
        } else if (typeof images === 'string') {
          user.images = images
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }
    }

    if (req.file) {
      user.profileImageData = req.file.buffer;
      user.profileImageContentType = req.file.mimetype;
    }

    const updated = await user.save();
    return res.json(buildUserResponse(updated));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

// PUT /api/users/me/password
const updateMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // pre-save hook will hash
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update password' });
  }
};

module.exports = { getMe, listBoardings, updateMe, updateMyPassword };

