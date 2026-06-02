const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String },
    notes: { type: String }
  },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true }, // Locks in price if menu changes later
    spiceLevel: { type: String }
  }],
  pricing: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Preparing', 'Out_For_Delivery', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  payment: {
    method: { type: String, enum: ['Card', 'Transfer', 'Pay_On_Delivery'], required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    reference: { type: String }, // Paystack/Flutterwave transaction ref
    
    // ---> NEW: Added Receipt Object for Cloudinary Uploads <---
    receipt: {
      url: { type: String },
      public_id: { type: String }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);