-- Cache keys for images served by /api/media.
--
-- Covers are stored as base64 data URLs. Listing endpoints must know whether
-- an image exists, and its URL needs a version, without reading the blob —
-- these columns provide both.

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "imageUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN "iconUpdatedAt" TIMESTAMP(3);

-- Backfill: existing rows already have an image, so seed the marker from the
-- row's own updatedAt rather than leaving them looking image-less.
UPDATE "Product"
SET "imageUpdatedAt" = "updatedAt"
WHERE "imageDataUrl" IS NOT NULL AND length("imageDataUrl") > 0;

UPDATE "PaymentMethod"
SET "iconUpdatedAt" = "updatedAt"
WHERE "iconDataUrl" IS NOT NULL AND length("iconDataUrl") > 0;
