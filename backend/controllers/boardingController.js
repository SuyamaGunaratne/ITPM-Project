const Boarding = require('../models/Boarding');
const User = require('../models/User');
const { sendBoardingNotification } = require('./notificationController');

// Helper function to convert image buffer to data URL
const convertImageToDataUrl = (img) => {
  if (!img || !img.data) return null;
  
  try {
    let buffer = img.data;
    
    // If data is already a Buffer, use it directly
    if (Buffer.isBuffer(buffer)) {
      const base64 = buffer.toString('base64');
      return {
        ...img,
        url: `data:${img.mimetype || 'image/jpeg'};base64,${base64}`,
        data: undefined
      };
    }
    
    // If data is a string (already base64), use it directly
    if (typeof buffer === 'string') {
      return {
        ...img,
        url: `data:${img.mimetype || 'image/jpeg'};base64,${buffer}`,
        data: undefined
      };
    }
    
    // If data is an object with type: 'Buffer' (MongoDB serialized format)
    if (buffer && buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
      const buf = Buffer.from(buffer.data);
      const base64 = buf.toString('base64');
      return {
        ...img,
        url: `data:${img.mimetype || 'image/jpeg'};base64,${base64}`,
        data: undefined
      };
    }
    
    return null;
  } catch (err) {
    console.error('[convertImageToDataUrl] Error:', err);
    return null;
  }
};

// Get all public boardings (for students)
const getAllBoardings = async (req, res) => {
  try {
    const { search, city, district, minRent, maxRent } = req.query;
    
    // Build filter object
    const filter = { isActive: true, isApproved: true };
    
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { boardingAddress: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    
    if (district) {
      filter.district = { $regex: district, $options: 'i' };
    }
    
    if (minRent || maxRent) {
      filter.monthlyRent = {};
      if (minRent) filter.monthlyRent.$gte = Number(minRent);
      if (maxRent) filter.monthlyRent.$lte = Number(maxRent);
    }
    
    const boardings = await Boarding.find(filter)
      .populate('owner', 'fullName email')
      .sort({ createdAt: -1 });
    
    const toResponse = boardings.map((boarding) => {
      const obj = boarding.toObject();
      
      // Convert images to base64 data URLs
      if (obj.images && Array.isArray(obj.images)) {
        obj.images = obj.images
          .map((img) => convertImageToDataUrl(img))
          .filter((img) => img !== null); // Remove any failed conversions
      }
      
      return obj;
    });
    
    return res.json(toResponse);
  } catch (err) {
    console.error('[getAllBoardings] Error:', err);
    return res.status(500).json({ message: 'Failed to fetch boardings' });
  }
};

// Get all boardings for the current user
const getMyBoardings = async (req, res) => {
  try {
    const boardings = await Boarding.find({ owner: req.user._id }).sort({ createdAt: -1 });
    
    const toResponse = boardings.map((boarding) => {
      const obj = boarding.toObject();
      
      // Convert images to base64 data URLs
      if (obj.images && Array.isArray(obj.images)) {
        obj.images = obj.images
          .map((img) => convertImageToDataUrl(img))
          .filter((img) => img !== null);
      }
      
      return obj;
    });

    return res.json(toResponse);
  } catch (err) {
    console.error('[getMyBoardings] Error:', err);
    return res.status(500).json({ message: 'Failed to fetch boardings' });
  }
};

// Get a single boarding by ID
const getBoardingById = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id);
    
    if (!boarding) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    // Check if user owns this boarding
    if (boarding.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this boarding' });
    }

    const obj = boarding.toObject();
    
    // Convert images to base64 data URLs
    if (obj.images && Array.isArray(obj.images)) {
      obj.images = obj.images
        .map((img) => convertImageToDataUrl(img))
        .filter((img) => img !== null);
    }

    return res.json(obj);
  } catch (err) {
    console.error('[getBoardingById] Error:', err);
    return res.status(500).json({ message: 'Failed to fetch boarding' });
  }
};

// Create a new boarding
const createBoarding = async (req, res) => {
  try {
    const {
      businessName,
      ownerNIC,
      boardingAddress,
      city,
      district,
      monthlyRent,
      availableRooms,
      description,
      facilities,
    } = req.body;

    // Validate required fields
    if (!businessName || !boardingAddress || !city || !district || !monthlyRent || !availableRooms) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const boarding = new Boarding({
      owner: req.user._id,
      businessName,
      ownerNIC: ownerNIC || req.user.ownerNIC || '',
      boardingAddress,
      city,
      district,
      monthlyRent: Number(monthlyRent),
      availableRooms: Number(availableRooms),
      description,
      facilities: Array.isArray(facilities)
        ? facilities
        : typeof facilities === 'string'
        ? facilities.split(',').map((f) => f.trim()).filter(Boolean)
        : [],
      images: []
    });

    // Add images from file uploads
    if (req.files && Array.isArray(req.files)) {
      boarding.images = req.files.map((file) => ({
        data: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }));
    }

    const saved = await boarding.save();

    // Send notifications to all students about the new boarding
    await sendBoardingNotification(
      saved._id,
      saved.businessName,
      req.user.fullName || 'Boarding Owner'
    );

    // Convert images to base64 for response
    const obj = saved.toObject();
    if (obj.images && Array.isArray(obj.images)) {
      obj.images = obj.images
        .map((img) => convertImageToDataUrl(img))
        .filter((img) => img !== null);
    }

    return res.status(201).json(obj);
  } catch (err) {
    console.error('[createBoarding] Error:', err);
    return res.status(500).json({ message: 'Failed to create boarding' });
  }
};

// Update a boarding
const updateBoarding = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id);

    if (!boarding) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    // Check if user owns this boarding
    if (boarding.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this boarding' });
    }

    const {
      businessName,
      ownerNIC,
      boardingAddress,
      city,
      district,
      monthlyRent,
      availableRooms,
      description,
      facilities,
      imagesToDelete,
    } = req.body;

    if (businessName !== undefined) boarding.businessName = businessName;
    if (ownerNIC !== undefined) boarding.ownerNIC = ownerNIC;
    if (boardingAddress !== undefined) boarding.boardingAddress = boardingAddress;
    if (city !== undefined) boarding.city = city;
    if (district !== undefined) boarding.district = district;
    if (monthlyRent !== undefined) boarding.monthlyRent = Number(monthlyRent);
    if (availableRooms !== undefined) boarding.availableRooms = Number(availableRooms);
    if (description !== undefined) boarding.description = description;

    if (facilities !== undefined) {
      boarding.facilities = Array.isArray(facilities)
        ? facilities
        : typeof facilities === 'string'
        ? facilities.split(',').map((f) => f.trim()).filter(Boolean)
        : [];
    }

    // Handle image deletion
    if (imagesToDelete && Array.isArray(imagesToDelete)) {
      boarding.images = boarding.images.filter(
        (img) => !imagesToDelete.includes(img.filename)
      );
    }

    // Add new images from file uploads
    if (req.files && Array.isArray(req.files)) {
      const newImages = req.files.map((file) => ({
        data: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }));
      boarding.images = [...boarding.images, ...newImages];
    }

    const updated = await boarding.save();

    // Convert images to base64 for response
    const obj = updated.toObject();
    if (obj.images && Array.isArray(obj.images)) {
      obj.images = obj.images
        .map((img) => convertImageToDataUrl(img))
        .filter((img) => img !== null);
    }

    return res.json(obj);
  } catch (err) {
    console.error('[updateBoarding] Error:', err);
    return res.status(500).json({ message: 'Failed to update boarding' });
  }
};

// Delete a boarding
const deleteBoarding = async (req, res) => {
  try {
    const boarding = await Boarding.findById(req.params.id);

    if (!boarding) {
      return res.status(404).json({ message: 'Boarding not found' });
    }

    // Check if user owns this boarding
    if (boarding.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this boarding' });
    }

    await Boarding.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Boarding deleted successfully' });
  } catch (err) {
    console.error('[deleteBoarding] Error:', err);
    return res.status(500).json({ message: 'Failed to delete boarding' });
  }
};

module.exports = {
  getAllBoardings,
  getMyBoardings,
  getBoardingById,
  createBoarding,
  updateBoarding,
  deleteBoarding
};
