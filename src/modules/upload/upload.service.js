const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const s3 = require("../../services/s3");
const config = require("../../config/env");
const prisma = require("../../db/prisma");
const { optimiseImage } = require("../../services/imageOptimizer");

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

// Categories that should be optimised (image → 3 WebP variants)
const OPTIMISABLE_CATEGORIES = new Set(["PRODUCT_IMAGE", "CATEGORY_IMAGE"]);

function generateKey(category, ext, userId) {
  const uuid = crypto.randomUUID();
  const prefix = {
    AVATAR: `avatars/${userId || uuid}`,
    PRODUCT_IMAGE: `products/${uuid}`,
    CATEGORY_IMAGE: `categories/${uuid}`,
    ORDER_DOCUMENT: `orders/${uuid}`,
    QUOTE_ATTACHMENT: `quotes/${uuid}`,
  };
  return `${prefix[category]}.${ext}`;
}

/**
 * Build S3 object key for an image variant.
 * Example: products/{productId}/{fileId}/thumbnail.webp
 */
function variantKey(category, entityId, fileId, variant) {
  const prefix = category === "PRODUCT_IMAGE" ? "products" : "categories";
  return `${prefix}/${entityId}/${fileId}/${variant}.webp`;
}

/**
 * Upload a single buffer to S3 with standard headers.
 */
async function uploadToS3(buffer, key, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

/**
 * Delete multiple S3 objects, ignoring 404 errors.
 */
async function deleteS3Objects(keys) {
  const results = await Promise.allSettled(
    keys.map((key) =>
      s3.send(
        new DeleteObjectCommand({
          Bucket: config.s3.bucket,
          Key: key,
        })
      )
    )
  );
  return results;
}

// ============================================================
// Загрузка через бэкенд (с оптимизацией для изображений)
// ============================================================
exports.uploadFile = async ({
  buffer,
  mimeType,
  originalName,
  category,
  userId,
  productId,
  orderId,
  quoteId,
}) => {
  const allowed = ALLOWED_MIME_TYPES[category];
  if (!allowed?.includes(mimeType)) {
    throw new Error(`File type ${mimeType} not allowed for ${category}`);
  }

  // --- Image optimisation path (PRODUCT_IMAGE / CATEGORY_IMAGE) ---
  if (OPTIMISABLE_CATEGORIES.has(category)) {
    const entityId = productId || "unknown";
    const { metadata, variants, fileId } = await optimiseImage(buffer, mimeType);

    const thumbnailKey = variantKey(category, entityId, fileId, "thumbnail");
    const cardKey = variantKey(category, entityId, fileId, "card");
    const heroKey = variantKey(category, entityId, fileId, "hero");

    // Upload all three variants in parallel
    try {
      await Promise.all([
        uploadToS3(variants.thumbnail, thumbnailKey, "image/webp"),
        uploadToS3(variants.card, cardKey, "image/webp"),
        uploadToS3(variants.hero, heroKey, "image/webp"),
      ]);
    } catch (uploadError) {
      // Partial upload failure — clean up any objects that were uploaded
      console.error("[upload] S3 upload failed, cleaning up:", uploadError.message);
      await deleteS3Objects([thumbnailKey, cardKey, heroKey]);
      throw new Error(`Failed to upload image variants to S3: ${uploadError.message}`);
    }

    // Build public URLs
    const baseUrl = config.s3.publicUrl;
    const thumbnailUrl = `${baseUrl}/${thumbnailKey}`;
    const cardUrl = `${baseUrl}/${cardKey}`;
    const heroUrl = `${baseUrl}/${heroKey}`;

    // Save to DB — use hero URL as the main url for backward compatibility
    const file = await prisma.file.create({
      data: {
        bucketKey: heroKey,
        url: heroUrl,
        mimeType: "image/webp",
        size: variants.hero.length,
        category,
        fileName: originalName,

        // Optimisation fields
        thumbnailKey,
        cardKey,
        heroKey,
        originalName,
        originalMimeType: mimeType,
        originalSizeBytes: buffer.length,
        width: metadata.width,
        height: metadata.height,

        ...(productId ? { product: { connect: { id: productId } } } : undefined),
        ...(orderId ? { order: { connect: { id: orderId } } } : undefined),
        ...(quoteId ? { quote: { connect: { id: quoteId } } } : undefined),
      },
    });

    // Return enriched response with all variant URLs
    return {
      ...file,
      thumbnailUrl,
      cardUrl,
      heroUrl,
    };
  }

  // --- Non-optimisable path (avatars, documents, etc.) ---
  const ext = mimeType.split("/")[1];
  const bucketKey = generateKey(category, ext, userId);

  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: bucketKey,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  const file = await prisma.file.create({
    data: {
      bucketKey,
      url: `${config.s3.publicUrl}/${bucketKey}`,
      mimeType,
      size: buffer.length,
      category,
      fileName: originalName,
      ...(productId ? { product: { connect: { id: productId } } } : undefined),
      ...(orderId ? { order: { connect: { id: orderId } } } : undefined),
      ...(quoteId ? { quote: { connect: { id: quoteId } } } : undefined),
    },
  });

  return file;
};

// Presigned URL для прямой загрузки (для больших файлов)
exports.getPresignedUploadUrl = async ({ category, mimeType, productId, orderId, quoteId }) => {
  const allowed = ALLOWED_MIME_TYPES[category];
  if (!allowed?.includes(mimeType)) {
    throw new Error(`File type ${mimeType} not allowed for ${category}`);
  }

  const ext = mimeType.split("/")[1];
  const bucketKey = generateKey(category, ext);

  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: bucketKey,
    ContentType: mimeType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 час

  return { presignedUrl, bucketKey, publicUrl: `${config.s3.publicUrl}/${bucketKey}` };
};

// Подтверждение загрузки по presigned URL
exports.confirmUpload = async ({
  bucketKey,
  mimeType,
  size,
  originalName,
  category,
  productId,
  orderId,
  quoteId,
}) => {
  return prisma.file.create({
    data: {
      bucketKey,
      url: `${config.s3.publicUrl}/${bucketKey}`,
      mimeType,
      size,
      category,
      fileName: originalName,
      ...(productId ? { product: { connect: { id: productId } } } : undefined),
      ...(orderId ? { order: { connect: { id: orderId } } } : undefined),
      ...(quoteId ? { quote: { connect: { id: quoteId } } } : undefined),
    },
  });
};

// Удаление файла (включая все варианты)
exports.deleteFile = async (fileId) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found");

  // Collect all S3 keys to delete
  const keysToDelete = [file.bucketKey];
  if (file.thumbnailKey) keysToDelete.push(file.thumbnailKey);
  if (file.cardKey) keysToDelete.push(file.cardKey);
  if (file.heroKey) keysToDelete.push(file.heroKey);

  await deleteS3Objects(keysToDelete);

  await prisma.file.delete({ where: { id: fileId } });

  return { ok: true };
};