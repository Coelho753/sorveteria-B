const Cart = require('../models/Cart');

const mapCart = (cart) => ({
  items: (cart?.items || []).map((item) => ({
    id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  })),
});

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.sub });
    res.json(mapCart(cart));
  } catch (e) { next(e); }
};

exports.replaceCart = async (req, res, next) => {
  try {
    const items = (req.body.items || []).map((item) => ({
      productId: item.productId || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    }));

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.sub },
      { $set: { items } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(mapCart(cart));
  } catch (e) { next(e); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.sub },
      { $set: { items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ items: [] });
  } catch (e) { next(e); }
};
