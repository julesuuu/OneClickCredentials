-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_studentProfileId_idx" ON "notification"("studentProfileId");

-- CreateIndex
CREATE INDEX "notification_isRead_idx" ON "notification"("isRead");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
