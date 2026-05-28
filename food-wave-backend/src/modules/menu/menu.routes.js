const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload'); // Adjust path to your upload.js if needed
const { protect } = require('../../middleware/auth');

const { 
  getMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  editMenuItem // <--- Import the new function
} = require('./menu.controller');

router.get('/', getMenuItems);
router.post('/', protect, upload.single('image'), createMenuItem);

// NEW EDIT ROUTE: Needs the image upload middleware just in case they change the picture!
router.put('/:id', protect, upload.single('image'), editMenuItem); 

router.patch('/:id', protect, updateMenuItem);
router.delete('/:id', protect, deleteMenuItem);

module.exports = router;