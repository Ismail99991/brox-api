const jwt = require("jsonwebtoken");

const CRM_JWT_SECRET = process.env.CRM_JWT_SECRET || "crm-dev-secret-change-in-production";

// Проверка JWT-токена CRM (сотрудники)
exports.crmAuthMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "no token provided" });
  }

  const token = header.split(" ")[1];

  if (!token || token.trim() === "") {
    return res.status(401).json({ error: "empty token" });
  }

  try {
    const decoded = jwt.verify(token, CRM_JWT_SECRET);
    req.crmUser = decoded; // { crmUserId, email, role }
    next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
};

// Проверка роли ADMIN/SUPERADMIN для CRM
exports.crmAdminMiddleware = (req, res, next) => {
  if (!req.crmUser) {
    return res.status(401).json({ error: "not authenticated" });
  }

  if (req.crmUser.role !== "ADMIN" && req.crmUser.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "insufficient permissions" });
  }

  next();
};