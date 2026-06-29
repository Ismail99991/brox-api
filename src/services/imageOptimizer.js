const sharp = require("sharp");
const crypto = require("crypto");

// ============================================================
// Image optimizer — server-side image processing pipeline
// ============================================================
//
// Produces three WebP variants:
//   thumbnail — 400×300 cover
//   card      — 900×700 cover
//   hero      — max 2000×1400 inside (no crop)
//
// All variants: withoutEnlargement: true, EXIF stripped
// ============================================================

const MAX_INPUT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_INPUT_DIMENSION = 8000; // 8000×8000 px

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const FORBIDDEN_MIME_TYPES = new Set(["image/svg+xml"]);

/**
 * Validate and optimise an image buffer.
 *
 * @param {Buffer} buffer - Raw image bytes
 * @param {string} mimeType - Declared MIME type
 * @returns {Promise<{
 *   metadata: sharp.Metadata,
 *   variants: { thumbnail: Buffer, card: Buffer, hero: Buffer },
 *   fileId: string
 * }>}
 */
async function optimiseImage(buffer, mimeType) {
  // 1. Size check
  if (buffer.length > MAX_INPUT_SIZE_BYTES) {
    throw new Error(
      `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB. Maximum allowed: 15 MB`
    );
  }

  // 2. MIME check — reject SVG explicitly
  if (FORBIDDEN_MIME_TYPES.has(mimeType)) {
    throw new Error(`File type ${mimeType} is not accepted via this endpoint`);
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // 3. Try to decode with sharp — validates the file is a real image
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new Error("Cannot decode image — file may be corrupted or not an image");
  }

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions");
  }

  // 4. Dimension check
  if (metadata.width > MAX_INPUT_DIMENSION || metadata.height > MAX_INPUT_DIMENSION) {
    throw new Error(
      `Image dimensions (${metadata.width}×${metadata.height}) exceed maximum allowed (${MAX_INPUT_DIMENSION}×${MAX_INPUT_DIMENSION})`
    );
  }

  // 5. Generate unique file ID
  const fileId = crypto.randomUUID();

  // 6. Build pipeline: auto-orient + strip EXIF
  const pipeline = sharp(buffer)
    .rotate() // honour EXIF orientation
    .withMetadata({ exif: undefined, icc: undefined, xmp: undefined }); // strip all metadata

  // 7. Generate three WebP variants in parallel
  const [thumbnail, card, hero] = await Promise.all([
    pipeline
      .clone()
      .resize(400, 300, { fit: "cover", position: "centre", withoutEnlargement: true })
      .webp({ quality: 76 })
      .toBuffer(),

    pipeline
      .clone()
      .resize(900, 700, { fit: "cover", position: "centre", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),

    pipeline
      .clone()
      .resize(2000, 1400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
  ]);

  return {
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    },
    variants: { thumbnail, card, hero },
    fileId,
  };
}

module.exports = {
  optimiseImage,
  ALLOWED_MIME_TYPES,
  MAX_INPUT_SIZE_BYTES,
  MAX_INPUT_DIMENSION,
};