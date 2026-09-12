-- Payment window. An unpaid OPEN order is closed automatically once
-- "expiresAt" passes; "expiredAt" records that the timer, not a person,
-- closed it.
ALTER TABLE "Order" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "expiredAt" TIMESTAMP(3);
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");
