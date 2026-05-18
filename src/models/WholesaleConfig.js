const mongoose = require('mongoose');

const wholesaleConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    threshold: { type: Number, min: 1, default: 10 },
    defaultDiscount: { type: Number, min: 0, max: 1, default: 0.1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WholesaleConfig', wholesaleConfigSchema);
