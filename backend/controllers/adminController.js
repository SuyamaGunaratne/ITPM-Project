const User = require('../models/User');

// Helper: remove heavy imageBuffer fields (but keep password for admins)
const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.profileImageData;
  delete obj.profileImageContentType;
  return obj;
};

// GET /api/admin/users?role=student|teacher|boardingOwner
const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-profileImageData -profileImageContentType');
    return res.json(users.map(sanitizeUser));
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ message: 'Failed to list users', error: error.message });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-profileImageData -profileImageContentType');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, ...rest } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'fullName, email, password, and role are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A user with that email already exists' });
    }

    const user = new User({
      fullName,
      email,
      password,
      role,
      ...rest,
    });

    await user.save();
    return res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Prevent role changes unless explicitly provided
    if (updates.role === undefined) {
      delete updates.role;
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    // If password is set, it will be hashed by pre-save hook
    await user.save();

    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
