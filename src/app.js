const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { authMiddleware } = require("./modules/auth/auth.middleware");

const app = express();

// security
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "brox-api" });
});

// catalog (public)
const catalogRoutes = require("./modules/catalog/catalog.routes");
app.use("/api", catalogRoutes);

// auth (public)
const authRoutes = require("./modules/auth/auth.routes");
app.use("/api/auth", authRoutes);

// admin (protected)
const adminRoutes = require("./modules/admin/admin.routes");
app.use("/api/admin", authMiddleware, adminRoutes);

// orders (protected)
const ordersRoutes = require("./modules/orders/orders.routes");
app.use("/api/orders", authMiddleware, ordersRoutes);

// users (protected)
const usersRoutes = require("./modules/users/users.routes");
app.use("/api/users", usersRoutes);

// metrics (public for tracking)
const metricsRoutes = require("./modules/metrics/metrics.routes");
app.use("/api/metrics", metricsRoutes);

// events
const eventsRouter = require("./modules/events/events.routes");
app.use("/api/events", eventsRouter);

// upload (protected)
const uploadRoutes = require("./modules/upload/upload.routes");
app.use("/api/upload", uploadRoutes);

module.exports = app;