const jwt = require('jsonwebtoken');
const Admin = require('./auth.model'); // Import the new model

// @desc    Admin Authentication
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // --- AUTO-SEED LOGIC ---
    // If the database is completely empty, create the first admin using your .env variables
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@foodwavebistro.com';
      const defaultPassword = process.env.ADMIN_PASSWORD;
      
      if (defaultPassword) {
        await Admin.create({ email: defaultEmail, password: defaultPassword });
      }
    }
    // -----------------------

    // Find the admin in the database
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    // Verify the password using the model method
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    // Generate secure token payload (now includes MongoDB ID)
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Admin Credentials
// @route   PUT /api/v1/auth/update-credentials
// @access  Private (Requires Token)
exports.updateCredentials = async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;
    
    // Extract the email from the JWT token passed by your auth middleware
    const decodedEmail = req.user?.email || req.admin?.email; 
    
    if (!decodedEmail) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }

    // Find the current admin
    const admin = await Admin.findOne({ email: decodedEmail }).select('+password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    // Verify they know the current password
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    // Update Email
    if (newEmail) {
      const emailExists = await Admin.findOne({ email: newEmail });
      if (emailExists && emailExists._id.toString() !== admin._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email is already in use.' });
      }
      admin.email = newEmail;
    }

    // Update Password (the model's pre-save hook will automatically hash it)
    if (newPassword) {
      admin.password = newPassword; 
    }

    // Save changes to MongoDB
    await admin.save();
    
    res.status(200).json({ success: true, message: 'Credentials updated successfully.' });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating credentials.' });
  }
};