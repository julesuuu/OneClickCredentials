-- CreateTable
CREATE TABLE "documentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentRequest_userId_idx" ON "documentRequest"("userId");

-- AddForeignKey
ALTER TABLE "documentRequest" ADD CONSTRAINT "documentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentRequest" ADD CONSTRAINT "documentRequest_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "documentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
