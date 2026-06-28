const jwt = require("jsonwebtoken");

const MARKET_JWT_SECRET = process.env.MARKET_JWT_SECRET || "market-dev-secret-change-in-production";

// Проверка JWT-токена маркета (клиенты)
exports.marketAuthMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "no token provided" });
  }

  const token = header.split(" ")[1];

  if (!token || token.trim() === "") {
    return res.status(401).json({ error: "empty token" });
  }

  try {
    const decoded = jwt.verify(token, MARKET_JWT_SECRET);
    req.marketUser = decoded; // { marketUserId, email }
    next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
};