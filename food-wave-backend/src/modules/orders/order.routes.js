const express = require('express');
const { createOrder, getAllOrders, updateOrderStatus } = require('./order.controller');
const { protect } = require('../../middleware/auth'); // Turn security back on!

const router = express.Router();

router.route('/')
  .post(createOrder) // Public: Anyone can place an order
  .get(protect, getAllOrders); // Protected: Only admin can view all orders

router.route('/:id/status')
  .patch(protect, updateOrderStatus); // Protected: Only admin can change status

module.exports = router;