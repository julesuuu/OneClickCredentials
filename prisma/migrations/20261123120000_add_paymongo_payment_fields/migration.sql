-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "checkoutSessionId" TEXT,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentMethodType" TEXT,
ADD COLUMN     "paymongoPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payment_checkoutSessionId_key" ON "payment"("checkoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_paymongoPaymentId_key" ON "payment"("paymongoPaymentId");

