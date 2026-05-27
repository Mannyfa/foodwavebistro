const express = require('express');
const router = express.Router();
const { login, updateCredentials } = require('./auth.controller'); 

// Import your JWT middleware. Ensure the path is correct based on your folder structure!
const { protect } = require('../../middleware/auth'); 

router.post('/login', login);

// The new protected settings route
router.put('/update-credentials', protect, updateCredentials);

module.exports = router;