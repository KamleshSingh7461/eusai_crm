-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "dateOfJoining" DATE,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "employeeCode" TEXT,
ADD COLUMN     "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "exitDate" DATE;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "cin" TEXT,
    "gstin" TEXT,
    "registeredAddress" TEXT,
    "officeAddress" TEXT,
    "website" TEXT,
    "hrEmail" TEXT,
    "hrPhone" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "signatoryName" TEXT,
    "signatoryTitle" TEXT,
    "signatureUrl" TEXT,
    "emailDomains" TEXT[],
    "verifyDomain" TEXT,
    "nextEmployeeNumber" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompanyHr" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_verifyDomain_key" ON "Company"("verifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "_CompanyHr_AB_unique" ON "_CompanyHr"("A", "B");

-- CreateIndex
CREATE INDEX "_CompanyHr_B_index" ON "_CompanyHr"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyHr" ADD CONSTRAINT "_CompanyHr_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyHr" ADD CONSTRAINT "_CompanyHr_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seed the five group companies (skipped if a code already exists) and link existing staff by email domain.
-- Wyldcard Stats has no email domain yet, so its staff are assigned by hand.
INSERT INTO "Company" ("id", "code", "legalName", "emailDomains", "updatedAt")
VALUES
    (md5(random()::text || clock_timestamp()::text)::uuid::text, 'AC',    'Alumni Connect India Private Limited',          ARRAY['alumniindia.com'],  CURRENT_TIMESTAMP),
    (md5(random()::text || clock_timestamp()::text)::uuid::text, 'FGSN',  'Freedom Global Sports Network Private Limited', ARRAY['fgsnlive.com'],     CURRENT_TIMESTAMP),
    (md5(random()::text || clock_timestamp()::text)::uuid::text, 'WS',    'Wyldcard Stats Private Limited',                ARRAY[]::TEXT[],           CURRENT_TIMESTAMP),
    (md5(random()::text || clock_timestamp()::text)::uuid::text, 'EUSAI', 'EUSAI Team Private Limited',                    ARRAY['eusaiteam.com'],    CURRENT_TIMESTAMP),
    (md5(random()::text || clock_timestamp()::text)::uuid::text, 'TTF',   'Trenz Team Fibre Private Limited',              ARRAY['teamfibreinc.com'], CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

UPDATE "User" u
SET "companyId" = c."id"
FROM "Company" c
WHERE u."companyId" IS NULL
  AND split_part(lower(u."email"), '@', 2) = ANY (c."emailDomains");
