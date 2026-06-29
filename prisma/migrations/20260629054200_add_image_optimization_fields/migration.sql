-- AlterTable
ALTER TABLE "File" ADD COLUMN     "cardKey" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "heroKey" TEXT,
ADD COLUMN     "originalMimeType" TEXT,
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "originalSizeBytes" INTEGER,
ADD COLUMN     "thumbnailKey" TEXT,
ADD COLUMN     "width" INTEGER;