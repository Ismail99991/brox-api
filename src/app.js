const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// sanitize Authorization header — remove invalid characters
app.use((req, res, next) => {
  const auth = req.headers["authorization"];
  if (auth) {
    const sanitized = auth.replace(/[\x00-\x1F\x7F]/g, "").trim();
    if (!sanitized || !sanitized.startsWith("Bearer ")) {
      delete req.headers["authorization"];
    } else {
      req.headers["authorization"] = sanitized;
    }
  }
  next();
});

// security
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "techsteam-api" });
});

// ============================================================
// PUBLIC — каталог (доступен всем без авторизации)
// ============================================================
const catalogRoutes = require("./modules/catalog/catalog.routes");
app.use("/api", catalogRoutes);

// ============================================================
// CRM — только для сотрудников (отдельный JWT)
// ============================================================
const crmAuthRoutes = require("./modules/auth-crm/auth-crm.routes");
app.use("/api/crm/auth", crmAuthRoutes);

const adminRoutes = require("./modules/admin/admin.routes");
const { crmAuthMiddleware } = require("./modules/middleware/crmAuth.middleware");
app.use("/api/admin", crmAuthMiddleware, adminRoutes);

// ============================================================
// MARKET — для клиентов (отдельный JWT)
// ============================================================
const marketAuthRoutes = require("./modules/auth-market/auth-market.routes");
app.use("/api/market/auth", marketAuthRoutes);

const { marketAuthMiddleware } = require("./modules/middleware/marketAuth.middleware");

const favoritesRoutes = require("./modules/favorites/favorites.routes");
app.use("/api/market/favorites", marketAuthMiddleware, favoritesRoutes);

const cartRoutes = require("./modules/cart/cart.routes");
app.use("/api/market/cart", marketAuthMiddleware, cartRoutes);

const ordersRoutes = require("./modules/orders/orders.routes");
app.use("/api/market/orders", ordersRoutes); // /my — защищён внутри

const ctaRoutes = require("./modules/cta/cta.routes");
app.use("/api/market", ctaRoutes); // /callback — публичный, /quote-request — защищён

// ============================================================
// ANALYTICS / METRICS
// ============================================================
const metricsRoutes = require("./modules/metrics/metrics.routes");
app.use("/api/metrics", metricsRoutes);

const eventsRouter = require("./modules/events/events.routes");
app.use("/api/events", eventsRouter);

// ============================================================
// UPLOAD (S3)
// ============================================================
const uploadRoutes = require("./modules/upload/upload.routes");
app.use("/api/upload", uploadRoutes);

module.exports = app;