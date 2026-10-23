-- CreateTable
CREATE TABLE "AddressApiRateLimit" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddressApiRateLimit_pkey" PRIMARY KEY ("key")
);
