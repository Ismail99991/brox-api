const router = require("express").Router();
const controller = require("./auth-crm.controller");
const { crmAuthMiddleware, crmAdminMiddleware } = require("../middleware/crmAuth.middleware");

// Публичный — логин для CRM
router.post("/login", controller.login);

// Защищённые — только для авторизованных сотрудников CRM
router.get("/me", crmAuthMiddleware, controller.getMe);

// Админские — управление сотрудниками (только SUPERADMIN/ADMIN)
router.get("/", crmAuthMiddleware, crmAdminMiddleware, controller.getAll);
router.get("/:id", crmAuthMiddleware, crmAdminMiddleware, controller.getOne);
router.post("/", crmAuthMiddleware, crmAdminMiddleware, controller.create);
router.put("/:id", crmAuthMiddleware, crmAdminMiddleware, controller.update);
router.delete("/:id", crmAuthMiddleware, crmAdminMiddleware, controller.remove);

module.exports = router;