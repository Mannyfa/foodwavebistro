const MenuItem = require('./menu.model');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all menu items
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
exports.createMenuItem = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'Please upload a meal image.' });
    }

    const newItemData = {
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      discountPercentage: Number(req.body.discountPercentage) || 0, // NEW: Discount 
      category: req.body.category,
      preparationTime: Number(String(req.body.preparationTime).replace(/\D/g, '')),
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      addOns: req.body.addOns ? JSON.parse(req.body.addOns) : [], // FIXED: Parse stringified array
      image: { 
        url: req.file.path, 
        public_id: req.file.filename 
      }
    };

    const newItem = await MenuItem.create(newItemData);

    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (typeof next !== 'undefined') next(error);
    else res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Edit a full menu item (Supports optional new image)
// @route   PUT /api/v1/menu/:id
// @access  Private (Admin only)
exports.editMenuItem = async (req, res) => {
  try {
    let item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    // Format updated data
    const updateData = {
      name: req.body.name || item.name,
      description: req.body.description || item.description,
      price: req.body.price ? Number(req.body.price) : item.price,
      discountPercentage: req.body.discountPercentage !== undefined ? Number(req.body.discountPercentage) : item.discountPercentage,
      category: req.body.category || item.category,
      preparationTime: req.body.preparationTime ? Number(String(req.body.preparationTime).replace(/\D/g, '')) : item.preparationTime,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(Boolean) : item.tags,
      addOns: req.body.addOns ? JSON.parse(req.body.addOns) : item.addOns,
    };

    // If a new image was uploaded, handle Cloudinary replacement
    if (req.file && req.file.path) {
      // Destroy old image to save Cloudinary storage space
      if (item.image && item.image.public_id) {
        await cloudinary.uploader.destroy(item.image.public_id);
      }
      // Save new image details
      updateData.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    // Apply updates
    item = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error("Edit error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Quick Update menu item (Used for "Toggle Availability")
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
    
    // Cleanup Cloudinary storage
    if (item.image && item.image.public_id) {
      await cloudinary.uploader.destroy(item.image.public_id);
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};