const express = require('express');
const router = express.Router();

// Import the admin AND customer functions from the controller
const { 
  login, 
  updateCredentials,
  registerCustomer, 
  loginCustomer 
} = require('./auth.controller'); 

// Import your JWT middleware. Ensure the path is correct based on your folder structure!
const { protect } = require('../../middleware/auth'); 

// --- ADMIN ROUTES ---
router.post('/login', login);

// The protected admin settings route
router.put('/update-credentials', protect, updateCredentials);


// --- CUSTOMER ROUTES ---
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

module.exports = router;