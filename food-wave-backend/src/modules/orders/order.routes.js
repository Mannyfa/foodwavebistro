const express = require('express');
const { createOrder, getAllOrders, updateOrderStatus } = require('./order.controller');
const { protect } = require('../../middleware/auth'); // Turn security back on!
const { getCustomerOrders } = require('./order.controller');
const router = express.Router();
const upload = require('../../middleware/upload'); 
const { uploadOrderReceipt } = require('./order.controller');


router.route('/')
  .post(createOrder) // Public: Anyone can place an order
  .get(protect, getAllOrders); // Protected: Only admin can view all orders

router.route('/history/:email')
  .get(getCustomerOrders); // Public: Customers can view their own order history

router.route('/:id/status')
  .patch(protect, updateOrderStatus); // Protected: Only admin can change status

  router.patch('/:id/receipt', upload.single('receipt'), uploadOrderReceipt);

module.exports = router;