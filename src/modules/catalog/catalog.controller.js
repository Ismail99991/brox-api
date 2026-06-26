const service = require("./catalog.service");

exports.getProducts = async (req, res) => {
  const data = await service.getProducts();
  res.json(data);
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