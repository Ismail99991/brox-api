const router = require("express").Router();
const controller = require("./catalog.controller");
const categoryRoutes = require("./category.routes");

// Категории (публичные)
router.use("/categories", categoryRoutes);

// Товары (публичные)
router.get("/products", controller.getProducts);
router.get("/products/:slug", controller.getProductBySlug);
router.get("/products/id/:id", controller.getProductById);

module.exports = router;