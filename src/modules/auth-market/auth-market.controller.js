const service = require("./auth-market.service");

exports.register = async (req, res) => {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await service.login(email, password);
  if (!result.ok) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }
  res.json(result);
};

exports.getProfile = async (req, res) => {
  const user = await service.getProfile(req.marketUser.marketUserId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await service.updateProfile(req.marketUser.marketUserId, req.body);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const result = await service.forgotPassword(req.body.email);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const result = await service.resetPassword(req.body.token, req.body.password);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};