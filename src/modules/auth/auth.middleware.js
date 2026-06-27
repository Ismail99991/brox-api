const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "brox-dev-secret";

exports.authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "no token provided" });
  }

  const token = header.split(" ")[1];

  if (!token || token.trim() === "") {
    return res.status(401).json({ error: "empty token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
};
