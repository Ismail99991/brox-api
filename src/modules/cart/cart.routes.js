const router = require("express").Router();
const controller = require("./cart.controller");

router.get("/", controller.getAll);
router.post("/", controller.add);
router.put("/:productId", controller.updateQuantity);
router.delete("/clear", controller.clear);
router.delete("/:productId", controller.remove);

module.exports = router;