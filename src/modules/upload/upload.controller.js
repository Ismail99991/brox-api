const service = require("./upload.service");
const prisma = require("../../db/prisma");

// Универсальная загрузка файла
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { buffer, mimetype, originalname } = req.file;
    const { category, productId } = req.body;

    const file = await service.uploadFile({
      buffer,
      mimeType: mimetype,
      originalName: originalname,
      category: category || "PRODUCT_IMAGE",
      userId: req.user.userId,
      productId,
    });

    res.json(file);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Загрузка аватара пользователя
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { buffer, mimetype, originalname, size } = req.file;

    // Удаляем старый аватар, если есть
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { avatarId: true },
    });

    if (currentUser?.avatarId) {
      await service.deleteFile(currentUser.avatarId);
    }

    // Загружаем новый
    const file = await service.uploadFile({
      buffer,
      mimeType: mimetype,
      originalName: originalname,
      category: "AVATAR",
      userId: req.user.userId,
    });

    // Обновляем пользователя
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarId: file.id },
      select: {
        id: true,
        email: true,
        avatar: true,
      },
    });

    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Получить presigned URL для загрузки
exports.getPresignedUrl = async (req, res) => {
  try {
    const { category, mimeType, productId, orderId, quoteId } = req.body;

    const result = await service.getPresignedUploadUrl({
      category,
      mimeType,
      userId: req.user.userId,
      productId,
      orderId,
      quoteId,
    });

    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Подтвердить загрузку по presigned URL
exports.confirmUpload = async (req, res) => {
  try {
    const { bucketKey, mimeType, size, originalName, category, productId, orderId, quoteId } = req.body;

    const file = await service.confirmUpload({
      bucketKey,
      mimeType,
      size,
      originalName,
      category,
      userId: req.user.userId,
      productId,
      orderId,
      quoteId,
    });

    // Если это аватар — обновляем пользователя
    if (category === "AVATAR") {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { avatarId: file.id },
      });
    }

    res.json(file);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Удалить файл
exports.remove = async (req, res) => {
  try {
    const result = await service.deleteFile(req.params.fileId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};