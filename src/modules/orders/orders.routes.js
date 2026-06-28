const router = require("express").Router();
const controller = require("./orders.controller");
const { marketAuthMiddleware } = require("../middleware/marketAuth.middleware");

// Маркет — создание заказа и мои заказы (защищённые)
router.post("/", marketAuthMiddleware, controller.create);
router.get("/my", marketAuthMiddleware, controller.getMyOrders);

// CRM — все заказы, детали, статусы (защита навешивается в app.js через crmAuthMiddleware)
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id/status", controller.updateStatus);
router.delete("/:id", controller.remove);

module.exports = router;