-- CreateTable
CREATE TABLE "MfaSessionAssurance" (
    "id" TEXT NOT NULL,
    "session_key_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assurance_level" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "factor_id" TEXT,

    CONSTRAINT "MfaSessionAssurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MfaSessionAssurance_session_key_hash_key" ON "MfaSessionAssurance"("session_key_hash");

-- CreateIndex
CREATE INDEX "MfaSessionAssurance_session_key_hash_user_id_assurance_level_idx" ON "MfaSessionAssurance"("session_key_hash", "user_id", "assurance_level");

-- CreateIndex
CREATE INDEX "MfaSessionAssurance_user_id_expires_at_idx" ON "MfaSessionAssurance"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "MfaSessionAssurance_revoked_at_expires_at_idx" ON "MfaSessionAssurance"("revoked_at", "expires_at");

-- AddForeignKey
ALTER TABLE "MfaSessionAssurance" ADD CONSTRAINT "MfaSessionAssurance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
