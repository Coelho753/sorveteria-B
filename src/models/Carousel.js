const mongoose = require('mongoose');

const CAROUSEL_KEYS = ['tubs', 'cups', 'popsiclesAgua', 'popsiclesLeite', 'popsiclesPremium', 'popsiclesSki', 'acai'];

const carouselItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    img: { type: String, trim: true, default: '' },
    desc: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const carouselSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: CAROUSEL_KEYS, trim: true },
    items: { type: [carouselItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Carousel', carouselSchema);
module.exports.CAROUSEL_KEYS = CAROUSEL_KEYS;
