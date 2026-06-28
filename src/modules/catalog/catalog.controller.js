const service = require("./catalog.service");

exports.getProducts = async (req, res) => {
  const data = await service.getProducts(req.query);
  const total = await service.getProductsCount(req.query);
  res.json({ data, total, page: parseInt(req.query.page) || 1, limit: Math.min(parseInt(req.query.limit) || 50, 100) });
};

exports.getProductBySlug = async (req, res) => {
  const data = await service.getProductBySlug(req.params.slug);

  if (!data) {
    return res.status(404).json({ error: "not found" });
  }

  res.json(data);
};

exports.getProductById = async (req, res) => {
  const data = await service.getProductById(req.params.id);

  if (!data) {
    return res.status(404).json({ error: "not found" });
  }

  res.json(data);
};