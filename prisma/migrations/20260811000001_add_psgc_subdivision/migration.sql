-- CreateTable
CREATE TABLE "PsgcSubdivision" (
    "id" TEXT NOT NULL,
    "psgcCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geographicLevel" TEXT NOT NULL,
    "parentPsgcCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'PSA_PSGC',
    "sourceVersion" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsgcSubdivision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsgcSubdivision_psgcCode_key" ON "PsgcSubdivision"("psgcCode");

-- CreateIndex
CREATE INDEX "PsgcSubdivision_parentPsgcCode_geographicLevel_idx" ON "PsgcSubdivision"("parentPsgcCode", "geographicLevel");

-- CreateIndex
CREATE INDEX "PsgcSubdivision_geographicLevel_name_idx" ON "PsgcSubdivision"("geographicLevel", "name");

-- CreateIndex
CREATE INDEX "PsgcSubdivision_geographicLevel_isActive_idx" ON "PsgcSubdivision"("geographicLevel", "isActive");

-- AddForeignKey
ALTER TABLE "PsgcSubdivision" ADD CONSTRAINT "PsgcSubdivision_parentPsgcCode_fkey" FOREIGN KEY ("parentPsgcCode") REFERENCES "PsgcSubdivision"("psgcCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add PSGC fields to Address
ALTER TABLE "Address" ADD COLUMN "regionPsgcCode" TEXT;
ALTER TABLE "Address" ADD COLUMN "provincePsgcCode" TEXT;
ALTER TABLE "Address" ADD COLUMN "localityPsgcCode" TEXT;
ALTER TABLE "Address" ADD COLUMN "sublocalityPsgcCode" TEXT;
