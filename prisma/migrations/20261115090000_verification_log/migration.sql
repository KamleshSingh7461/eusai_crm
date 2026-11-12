-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "cardId" TEXT,
    "method" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "host" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationLog_cardId_createdAt_idx" ON "VerificationLog"("cardId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationLog_ipHash_createdAt_idx" ON "VerificationLog"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "IdCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

