const router = require("express").Router();
const controller = require("./category.controller");

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

module.exports = router;