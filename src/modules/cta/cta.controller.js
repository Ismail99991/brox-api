const service = require("./cta.service");

// POST /api/market/callback — публичный
exports.createCallback = async (req, res) => {
  try {
    const data = await service.createCallback(req.body);
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// POST /api/market/quote-request — защищённый (маркет-пользователь)
exports.createQuoteRequest = async (req, res) => {
  try {
    const data = await service.createQuoteRequest({
      marketUserId: req.marketUser.marketUserId,
      productId: req.body.productId,
      message: req.body.message,
      payload: req.body.payload,
    });
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// GET /api/market/quote-request — мои заявки
exports.getMyQuoteRequests = async (req, res) => {
  const data = await service.getMyQuoteRequests(req.marketUser.marketUserId);
  res.json(data);
};