const router = require("express").Router();
const multer = require("multer");
const controller = require("./upload.controller");
const { authMiddleware } = require("../auth/auth.middleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB лимит для бэкенд-загрузки
});

router.use(authMiddleware);

// Загрузка через бэкенд (для маленьких файлов)
router.post("/avatar", upload.single("file"), controller.uploadAvatar);

// Presigned URL (для больших файлов)
router.post("/presigned-url", controller.getPresignedUrl);
router.post("/confirm", controller.confirmUpload);

// Удаление
router.delete("/:fileId", controller.remove);

module.exports = router;