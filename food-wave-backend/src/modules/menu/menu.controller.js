const MenuItem = require('./menu.model');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all menu items (with optional category filter)
// @route   GET /api/v1/menu
// @access  Public
exports.getMenuItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new menu item
// @route   POST /api/v1/menu
// @access  Private (Admin only)
// @desc    Create a new menu item
// @route   POST /api/v1/menu
// @access  Private (Admin only)
exports.createMenuItem = async (req, res) => {
  try {
    // 1. When using multer-storage-cloudinary, req.file.path IS the Cloudinary URL
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'Please upload a meal image.' });
    }

    // 2. Format the data
    const newItemData = {
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      // Handle preparationTime safely (in case user types "25 min" or just "25")
      preparationTime: Number(String(req.body.preparationTime).replace(/\D/g, '')),
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      image: { 
        url: req.file.path, // Automatically provided by CloudinaryStorage
        public_id: req.file.filename // Automatically provided by CloudinaryStorage
      }
    };

    // 3. Save to database
    const newItem = await MenuItem.create(newItemData);

    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    console.error("Upload error:", error);
    // Use the global error handler via next()
    if (typeof next !== 'undefined') next(error);
    else res.status(400).json({ success: false, message: error.message });
  }
};


// @desc    Update menu item (e.g., toggle availability)
// @route   PATCH /api/v1/menu/:id
// @access  Private (Admin)
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/v1/menu/:id
// @access  Private (Admin)
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};