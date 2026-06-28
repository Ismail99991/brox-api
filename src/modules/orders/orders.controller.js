const service = require("./orders.service");

// CREATE (маркет-пользователь)
exports.create = async (req, res) => {
  try {
    const order = await service.createOrder({
      marketUserId: req.marketUser.marketUserId,
      items: req.body.items,
    });
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// GET ALL (CRM — все заказы)
exports.getAll = async (req, res) => {
  const data = await service.getOrders();
  res.json(data);
};

// GET MY ORDERS (маркет-пользователь)
exports.getMyOrders = async (req, res) => {
  const data = await service.getMyOrders(req.marketUser.marketUserId);
  res.json(data);
};

// GET ONE
exports.getOne = async (req, res) => {
  const data = await service.getOrderById(req.params.id);
  if (!data) return res.status(404).json({ error: "not found" });
  res.json(data);
};

// UPDATE STATUS (CRM)
exports.updateStatus = async (req, res) => {
  try {
    const data = await service.updateStatus(req.params.id, req.body.status);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// DELETE (CRM)
exports.remove = async (req, res) => {
  const data = await service.deleteOrder(req.params.id);
  res.json(data);
};