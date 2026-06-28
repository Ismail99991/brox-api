const service = require("./catalog.service");

exports.getProducts = async (req, res) => {
  try {
    const data = await service.getProducts(req.query);
    const total = await service.getProductsCount(req.query);
    res.json({ data, total, page: parseInt(req.query.page) || 1, limit: Math.min(parseInt(req.query.limit) || 50, 100) });
  } catch (e) {
    console.error("[catalog.getProducts]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const data = await service.getProductBySlug(req.params.slug);

    if (!data) {
      return res.status(404).json({ error: "not found" });
    }

    res.json(data);
  } catch (e) {
    console.error("[catalog.getProductBySlug]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const data = await service.getProductById(req.params.id);

    if (!data) {
      return res.status(404).json({ error: "not found" });
    }

    res.json(data);
  } catch (e) {
    console.error("[catalog.getProductById]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};