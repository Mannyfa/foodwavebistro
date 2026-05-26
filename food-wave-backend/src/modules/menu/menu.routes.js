const express = require('express');
const { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } = require('./menu.controller');
const { protect } = require('../../middleware/auth'); // Turn security back on!
const upload = require('../../middleware/upload');

const router = express.Router();

router.route('/')
  .get(getMenuItems) // Public: Anyone can see the menu
  .post(protect, upload.single('image'), createMenuItem); // Protected: Only admin can add

router.route('/:id')
  .patch(protect, updateMenuItem) // Protected: Edit/Toggle
  .delete(protect, deleteMenuItem); // Protected: Delete

module.exports = router;