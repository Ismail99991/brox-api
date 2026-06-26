const service = require("./category.service");

exports.getAll = async (req, res) => {
  const data = await service.getAll();
  res.json(data);
};

exports.getById = async (req, res) => {
  const data = await service.getById(req.params.id);
  if (!data) return res.status(404).json({ error: "Category not found" });
  res.json(data);
};

exports.create = async (req, res) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
};

exports.update = async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.json(data);
};

exports.remove = async (req, res) => {
  await service.remove(req.params.id);
  res.json({ ok: true });
};