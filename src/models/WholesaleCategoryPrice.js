const mongoose = require('mongoose');

const wholesaleCategoryPriceSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['tub', 'cup', 'popsicle'], required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('WholesaleCategoryPrice', wholesaleCategoryPriceSchema);
