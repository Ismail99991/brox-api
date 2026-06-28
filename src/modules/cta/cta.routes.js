const router = require("express").Router();
const controller = require("./cta.controller");

// Публичные
router.post("/callback", controller.createCallback);

// Защищённые (marketAuthMiddleware навешивается в app.js)
router.post("/quote-request", controller.createQuoteRequest);
router.get("/quote-request", controller.getMyQuoteRequests);

module.exports = router;