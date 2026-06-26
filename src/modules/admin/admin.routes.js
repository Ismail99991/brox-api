const router = require("express").Router();
const controller = require("./admin.controller");
const categoryController = require("../catalog/category.controller");

// Categories
router.post("/categories", categoryController.create);
router.put("/categories/:id", categoryController.update);
router.delete("/categories/:id", categoryController.remove);

// Products
router.post("/products", controller.createProduct);
router.put("/products/:id", controller.updateProduct);
router.delete("/products/:id", controller.deleteProduct);

module.exports = router;