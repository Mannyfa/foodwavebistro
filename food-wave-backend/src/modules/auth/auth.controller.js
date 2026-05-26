const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Admin Authentication
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Enforce matching admin credentials via environment configurations
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@foodwavebistro.com';
    
    // For maximum production safety, hash your plain text password string
    const isMatch = (email === adminEmail && password === process.env.ADMIN_PASSWORD);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials' });
    }

    // Generate secure token payload
    const token = jwt.sign(
      { email: adminEmail, role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};