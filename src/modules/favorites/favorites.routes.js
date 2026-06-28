const router = require("express").Router();
const controller = require("./favorites.controller");

router.get("/", controller.getAll);
router.post("/", controller.add);
router.get("/check/:productId", controller.check);
router.delete("/:productId", controller.remove);

module.exports = router;