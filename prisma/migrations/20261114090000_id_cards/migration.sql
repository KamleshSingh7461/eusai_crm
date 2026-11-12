-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "cardValidityMonths" INTEGER NOT NULL DEFAULT 24;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "IdCard" (
    "id" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATE NOT NULL,
    "issuedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredImage" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdCard_cardNumber_key" ON "IdCard"("cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IdCard_token_key" ON "IdCard"("token");

-- CreateIndex
CREATE INDEX "IdCard_userId_status_idx" ON "IdCard"("userId", "status");

-- CreateIndex
CREATE INDEX "StoredImage_userId_idx" ON "StoredImage"("userId");

-- CreateIndex
CREATE INDEX "StoredImage_companyId_idx" ON "StoredImage"("companyId");

-- AddForeignKey
ALTER TABLE "IdCard" ADD CONSTRAINT "IdCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdCard" ADD CONSTRAINT "IdCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

