-- Bot statistics: who actually talked to the bot, not only opened the app.
ALTER TABLE "User" ADD COLUMN "botStartedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "botLastSeenAt" TIMESTAMP(3);
CREATE INDEX "User_botStartedAt_idx" ON "User"("botStartedAt");

-- Product view statistics.
ALTER TABLE "Product" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Product_viewCount_idx" ON "Product"("viewCount");

CREATE TABLE "ProductView" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductView_productId_userId_key" ON "ProductView"("productId", "userId");
CREATE INDEX "ProductView_productId_lastAt_idx" ON "ProductView"("productId", "lastAt");
CREATE INDEX "ProductView_userId_lastAt_idx" ON "ProductView"("userId", "lastAt");
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Buyers can drop finished orders from their own history; the shop keeps them.
ALTER TABLE "Order" ADD COLUMN "hiddenByBuyerAt" TIMESTAMP(3);
CREATE INDEX "Order_createdById_hiddenByBuyerAt_idx" ON "Order"("createdById", "hiddenByBuyerAt");

-- Optional channel subscription gate.
ALTER TABLE "ShopSettings" ADD COLUMN "requiredChannel" TEXT;

-- Broadcast log.
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageDataUrl" TEXT,
    "buttonLabel" TEXT,
    "buttonUrl" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Broadcast_startedAt_idx" ON "Broadcast"("startedAt");
