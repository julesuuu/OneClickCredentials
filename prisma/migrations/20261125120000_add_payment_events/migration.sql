-- CreateTable
CREATE TABLE "paymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "amount" INTEGER,
    "actorType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT,
    "source" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "externalEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paymentEvent_externalEventId_key" ON "paymentEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "paymentEvent_paymentId_createdAt_idx" ON "paymentEvent"("paymentId", "createdAt");

-- AddForeignKey
ALTER TABLE "paymentEvent" ADD CONSTRAINT "paymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
