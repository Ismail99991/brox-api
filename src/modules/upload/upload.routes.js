const router = require("express").Router();
const multer = require("multer");
const controller = require("./upload.controller");
const { authMiddleware } = require("../auth/auth.middleware");

// Multer: memory storage, 15 MB limit (matches imageOptimizer MAX_INPUT_SIZE_BYTES)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

// Simple concurrency limiter: max 2 concurrent uploads
let activeUploads = 0;
const MAX_CONCURRENT_UPLOADS = 2;

function concurrencyLimit(req, res, next) {
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    return res.status(429).json({
      error: "Too many concurrent uploads. Please wait and try again.",
    });
  }
  activeUploads++;
  res.on("finish", () => {
    activeUploads = Math.max(0, activeUploads - 1);
  });
  next();
}

router.use(authMiddleware);

// Универсальная загрузка файла (с оптимизацией для изображений)
router.post("/file", concurrencyLimit, upload.single("file"), controller.uploadFile);

// Загрузка через бэкенд (для маленьких файлов)
router.post("/avatar", concurrencyLimit, upload.single("file"), controller.uploadAvatar);

// Presigned URL (для больших файлов)
router.post("/presigned-url", controller.getPresignedUrl);
router.post("/confirm", controller.confirmUpload);

// Удаление
router.delete("/:fileId", controller.remove);

module.exports = router;