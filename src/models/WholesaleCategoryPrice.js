const mongoose = require('mongoose');
const { PRODUCT_CATEGORIES } = require('./Product');

const wholesaleCategoryPriceSchema = new mongoose.Schema(
  {
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' }, collection: 'wholesale_category_prices' }
);

module.exports = mongoose.model('WholesaleCategoryPrice', wholesaleCategoryPriceSchema);
