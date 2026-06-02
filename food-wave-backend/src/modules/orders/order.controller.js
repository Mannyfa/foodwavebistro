const Order = require('./order.model');

// @desc    Create a new order & emit real-time event to Admin
// @route   POST /api/v1/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Create order entry in MongoDB
    const newOrder = await Order.create(orderData);
    
    // Populate reference items for full detail viewing on Admin Dashboard
    const populatedOrder = await Order.findById(newOrder._id).populate('items.menuItem');

    // Retrieve Socket.io instance and broadcast instantly to the Admin room
    const io = req.app.get('io');
    io.to('admin_dashboard').emit('new_order_received', populatedOrder);

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (for Admin view)
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order workflow status (e.g., Preparing -> Out_For_Delivery)
// @route   PATCH /api/v1/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Broadcast status change updates live back to admin components and/or frontend trackers
    const io = req.app.get('io');
    io.to('admin_dashboard').emit('order_status_updated', order);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get order history for a specific customer
// @route   GET /api/v1/orders/history/:email
// @access  Public
exports.getCustomerOrders = async (req, res) => {
  try {
    // Find orders matching the customer's email and sort by newest first
    const orders = await Order.find({ 'customer.email': req.params.email })
      .populate('items.menuItem', 'name') // Pulls the meal name so the frontend can display it
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadOrderReceipt = async (req, res) => {
  try {
    // req.file is provided by your Cloudinary upload middleware
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    // Find the order and update it
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.payment.receipt = {
      url: req.file.path,
      public_id: req.file.filename
    };
    
    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};