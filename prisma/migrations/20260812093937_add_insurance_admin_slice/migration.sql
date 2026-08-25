-- CreateTable
CREATE TABLE "insurance_configs" (
    "id" TEXT NOT NULL,
    "killSwitchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "insurance_configs_pkey" PRIMARY KEY ("id")
);
