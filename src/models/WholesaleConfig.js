const mongoose = require('mongoose');

const wholesaleConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    threshold: { type: Number, min: 1, default: 3 },
    defaultDiscount: { type: Number, min: 0, max: 1, default: 0.35 },
  },
  { timestamps: true, collection: 'wholesale_config', toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

wholesaleConfigSchema.virtual('default_discount').get(function getDefaultDiscount() { return this.defaultDiscount; }).set(function setDefaultDiscount(value) { this.defaultDiscount = value; });

module.exports = mongoose.model('WholesaleConfig', wholesaleConfigSchema);
