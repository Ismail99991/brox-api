const service = require("./category.service");

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (e) {
    console.error("[category.getAll]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Category not found" });
    res.json(data);
  } catch (e) {
    console.error("[category.getById]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json(data);
  } catch (e) {
    console.error("[category.create]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body);
    res.json(data);
  } catch (e) {
    console.error("[category.update]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("[category.remove]", e);
    res.status(500).json({ error: "Internal server error" });
  }
};