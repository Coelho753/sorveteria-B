const Carousel = require('../models/Carousel');
const { CAROUSEL_KEYS } = require('../models/Carousel');

exports.list = async (req, res, next) => {
  try {
    const rows = await Carousel.find().sort({ key: 1 });
    const byKey = new Map(rows.map((row) => [row.key, row]));
    res.json(CAROUSEL_KEYS.map((key) => byKey.get(key) || { key, items: [] }));
  } catch (e) { next(e); }
};

exports.getByKey = async (req, res, next) => {
  try {
    const carousel = await Carousel.findOne({ key: req.params.key });
    res.json(carousel || { key: req.params.key, items: [] });
  } catch (e) { next(e); }
};

exports.replace = async (req, res, next) => {
  try {
    const carousel = await Carousel.findOneAndUpdate(
      { key: req.params.key },
      { $set: { items: req.body.items || [] } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(carousel);
  } catch (e) { next(e); }
};
