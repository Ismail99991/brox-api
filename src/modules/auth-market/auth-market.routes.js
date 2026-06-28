const router = require("express").Router();
const controller = require("./auth-market.controller");
const { marketAuthMiddleware } = require("../middleware/marketAuth.middleware");

// Публичные
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// Защищённые
router.get("/profile", marketAuthMiddleware, controller.getProfile);
router.put("/profile", marketAuthMiddleware, controller.updateProfile);

module.exports = router;