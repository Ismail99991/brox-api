const service = require("./favorites.service");

exports.getAll = async (req, res) => {
  const data = await service.getFavorites(req.marketUser.marketUserId);
  res.json(data);
};

exports.add = async (req, res) => {
  try {
    const data = await service.addFavorite(req.marketUser.marketUserId, req.body.productId);
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const data = await service.removeFavorite(req.marketUser.marketUserId, req.params.productId);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.check = async (req, res) => {
  const data = await service.checkFavorite(req.marketUser.marketUserId, req.params.productId);
  res.json(data);
};