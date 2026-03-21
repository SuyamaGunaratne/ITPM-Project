const Boarding = require('../models/BoardingModel');

// @desc    Add a new boarding
// @route   POST /api/boardings
// @access  Private (Boarding Owner)
const addBoarding = async (req, res) => {
  try {
    const { title, description, location, type, rent, totalRooms, vacantRooms, amenities, images } = req.body;

    const boarding = await Boarding.create({
      title,
      description,
      location,
      type,
      rent,
      totalRooms,
      vacantRooms,
      amenities,
      images,
      owner: req.user._id
    });

    res.status(201).json({ message: 'Boarding added successfully', boarding });
  } catch (error) {
    console.error('Error adding boarding:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all boardings of the logged-in owner
// @route   GET /api/boardings/my
// @access  Private (Boarding Owner)
const getMyBoardings = async (req, res) => {
  try {
    const boardings = await Boarding.find({ owner: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json(boardings);
  } catch (error) {
    console.error('Error fetching boardings:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a boarding
// @route   PUT /api/boardings/:id
// @access  Private (Boarding Owner - own listings only)
const updateBoarding = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id);

    if (!boarding) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    // Check ownership
    if (boarding.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this boarding' });
    }

    const updatedBoarding = await Boarding.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Boarding updated successfully', boarding: updatedBoarding });
  } catch (error) {
    console.error('Error updating boarding:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a boarding
// @route   DELETE /api/boardings/:id
// @access  Private (Boarding Owner - own listings only)
const deleteBoarding = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id);

    if (!boarding) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    // Check ownership
    if (boarding.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this boarding' });
    }

    await Boarding.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Boarding deleted successfully' });
  } catch (error) {
    console.error('Error deleting boarding:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search all boardings (with filters)
// @route   GET /api/boardings?location=xxx&minRent=1000&maxRent=5000&type=single&search=keyword
// @access  Public (Students)
const getAllBoardings = async (req, res) => {
  try {
    const { location, minRent, maxRent, type, search } = req.query;

    // Build filter object — only show active boardings to students
    const filter = { status: 'active' };

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      filter.type = type;
    }

    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = Number(minRent);
      if (maxRent) filter.rent.$lte = Number(maxRent);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const boardings = await Boarding.find(filter)
      .populate('owner', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json(boardings);
  } catch (error) {
    console.error('Error searching boardings:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single boarding details
// @route   GET /api/boardings/:id
// @access  Public (Students)
const getBoardingById = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id)
      .populate('owner', 'fullName email');

    if (!boarding) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    res.status(200).json(boarding);
  } catch (error) {
    console.error('Error fetching boarding:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addBoarding,
  getMyBoardings,
  updateBoarding,
  deleteBoarding,
  getAllBoardings,
  getBoardingById
};
