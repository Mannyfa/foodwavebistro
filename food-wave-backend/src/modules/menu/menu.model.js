const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true },
  
  // NEW: Discount Field for Sales/Promos
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  category: { 
    type: String, 
    required: true,
    enum: ['Rice Meals', 'Pasta', 'Grills', 'Small Chops', 'Seafood', 'Drinks', 'Specials']
  },
  image: {
    url: { type: String, required: true },
    public_id: { type: String } 
  },
  tags: [{ type: String }],
  preparationTime: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  spiceLevels: [{ type: String }],
  
  // Add-ons field
  addOns: [{
    name: { type: String, required: true },
    price: { type: Number, required: true }
  }],
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);