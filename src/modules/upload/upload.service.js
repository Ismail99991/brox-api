const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const s3 = require("../../services/s3");
const config = require("../../config/env");
const prisma = require("../../db/prisma");

const ALLOWED_MIME_TYPES = {
  AVATAR: ["image/jpeg", "image/png", "image/webp"],
  PRODUCT_IMAGE: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  CATEGORY_IMAGE: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  ORDER_DOCUMENT: ["application/pdf", "image/jpeg", "image/png"],
  QUOTE_ATTACHMENT: ["application/pdf", "image/jpeg", "image/png", "application/x-zip-compressed"],
};

const MAX_FILE_SIZES = {
  AVATAR: 5 * 1024 * 1024,       // 5 MB
  PRODUCT_IMAGE: 10 * 1024 * 1024, // 10 MB
  CATEGORY_IMAGE: 10 * 1024 * 1024, // 10 MB
  ORDER_DOCUMENT: 50 * 1024 * 1024, // 50 MB
  QUOTE_ATTACHMENT: 50 * 1024 * 1024,
};

function generateKey(category, userId, ext) {
  const uuid = crypto.randomUUID();
  const prefix = {
    AVATAR: `avatars/${userId}`,
    PRODUCT_IMAGE: `products/${uuid}`,
    CATEGORY_IMAGE: `categories/${uuid}`,
    ORDER_DOCUMENT: `orders/${uuid}`,
    QUOTE_ATTACHMENT: `quotes/${uuid}`,
  };
  return `${prefix[category]}.${ext}`;
}

// Загрузка через бэкенд (для аватаров)
exports.uploadFile = async ({ buffer, mimeType, originalName, category, userId, productId, orderId, quoteId }) => {
  const allowed = ALLOWED_MIME_TYPES[category];
  if (!allowed?.includes(mimeType)) {
    throw new Error(`File type ${mimeType} not allowed for ${category}`);
  }

  const ext = mimeType.split("/")[1];
  const bucketKey = generateKey(category, userId, ext);

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: bucketKey,
    Body: buffer,
    ContentType: mimeType,
  }));

  const file = await prisma.file.create({
    data: {
      bucketKey,
      url: `${config.s3.publicUrl}/${bucketKey}`,
      mimeType,
      size: buffer.length,
      category,
      fileName: originalName,
      userId,
      productId,
      orderId,
      quoteId,
    },
  });

  return file;
};

// Presigned URL для прямой загрузки (для больших файлов)
exports.getPresignedUploadUrl = async ({ category, mimeType, userId, productId, orderId, quoteId }) => {
  const allowed = ALLOWED_MIME_TYPES[category];
  if (!allowed?.includes(mimeType)) {
    throw new Error(`File type ${mimeType} not allowed for ${category}`);
  }

  const ext = mimeType.split("/")[1];
  const bucketKey = generateKey(category, userId, ext);

  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: bucketKey,
    ContentType: mimeType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 час

  return { presignedUrl, bucketKey, publicUrl: `${config.s3.publicUrl}/${bucketKey}` };
};

// Подтверждение загрузки по presigned URL
exports.confirmUpload = async ({ bucketKey, mimeType, size, originalName, category, userId, productId, orderId, quoteId }) => {
  return prisma.file.create({
    data: {
      bucketKey,
      url: `${config.s3.publicUrl}/${bucketKey}`,
      mimeType,
      size,
      category,
      fileName: originalName,
      userId,
      productId,
      orderId,
      quoteId,
    },
  });
};

// Удаление файла
exports.deleteFile = async (fileId) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found");

  await s3.send(new DeleteObjectCommand({
    Bucket: config.s3.bucket,
    Key: file.bucketKey,
  }));

  await prisma.file.delete({ where: { id: fileId } });

  return { ok: true };
};