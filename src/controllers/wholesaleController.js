const Product = require('../models/Product');
const WholesaleCategoryPrice = require('../models/WholesaleCategoryPrice');
const WholesaleConfig = require('../models/WholesaleConfig');
const { normalizeCategory } = require('../models/Product');

const wholesaleCategories = ['tub', 'cup', 'popsicle'];

const getConfig = async () => WholesaleConfig.findOneAndUpdate(
  { key: 'default' },
  { $setOnInsert: { key: 'default' } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

const summaryPayload = async () => {
  const [config, categoryRows, productRows] = await Promise.all([
    getConfig(),
    WholesaleCategoryPrice.find(),
    Product.find({ wholesalePrice: { $ne: null } }).select('_id wholesalePrice'),
  ]);

  return {
    categories: Object.fromEntries(categoryRows.map((row) => [row.category, row.price])),
    products: Object.fromEntries(productRows.map((product) => [product._id.toString(), product.wholesalePrice])),
    threshold: config.threshold,
    defaultDiscount: config.defaultDiscount,
    default_discount: config.defaultDiscount,
  };
};

exports.summary = async (req, res, next) => {
  try { res.json(await summaryPayload()); } catch (e) { next(e); }
};

exports.upsertCategory = async (req, res, next) => {
  try {
    const category = normalizeCategory(req.body.category);
    if (!wholesaleCategories.includes(category)) return res.status(400).json({ message: 'Categoria de atacado inválida' });
    await WholesaleCategoryPrice.findOneAndUpdate(
      { category },
      { $set: { price: req.body.price } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(await summaryPayload());
  } catch (e) { next(e); }
};

exports.upsertProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.body.productId,
      { $set: { wholesalePrice: req.body.price } },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(await summaryPayload());
  } catch (e) { next(e); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = normalizeCategory(req.params.cat);
    await WholesaleCategoryPrice.deleteOne({ category });
    res.json(await summaryPayload());
  } catch (e) { next(e); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { $set: { wholesalePrice: null } }, { runValidators: true });
    res.json(await summaryPayload());
  } catch (e) { next(e); }
};

exports.getConfig = async (req, res, next) => {
  try {
    const config = await getConfig();
    res.json({ threshold: config.threshold, defaultDiscount: config.defaultDiscount, default_discount: config.defaultDiscount });
  } catch (e) { next(e); }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const config = await getConfig();
    if (req.body.threshold !== undefined) config.threshold = req.body.threshold;
    if (req.body.defaultDiscount !== undefined) config.defaultDiscount = req.body.defaultDiscount;
    if (req.body.default_discount !== undefined) config.defaultDiscount = req.body.default_discount;
    await config.save();
    res.json({ threshold: config.threshold, defaultDiscount: config.defaultDiscount, default_discount: config.defaultDiscount });
  } catch (e) { next(e); }
};
