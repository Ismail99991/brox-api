const service = require("./cart.service");

exports.getAll = async (req, res) => {
  const data = await service.getCart(req.marketUser.marketUserId);
  res.json(data);
};

exports.add = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const data = await service.addToCart(req.marketUser.marketUserId, productId, quantity);
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const data = await service.updateQuantity(req.marketUser.marketUserId, req.params.productId, req.body.quantity);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const data = await service.removeFromCart(req.marketUser.marketUserId, req.params.productId);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.clear = async (req, res) => {
  const data = await service.clearCart(req.marketUser.marketUserId);
  res.json(data);
};