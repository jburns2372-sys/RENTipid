-- CreateTable
CREATE TABLE "UserMfa" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "envelope_version" TEXT NOT NULL,
    "envelope_algorithm" TEXT NOT NULL,
    "envelope_key_id" TEXT NOT NULL,
    "envelope_nonce" TEXT NOT NULL,
    "envelope_ciphertext" TEXT NOT NULL,
    "envelope_auth_tag" TEXT NOT NULL,
    "recovery_code_hashes" TEXT[],
    "recovery_codes_consumed" INTEGER NOT NULL DEFAULT 0,
    "security_version" INTEGER NOT NULL DEFAULT 1,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),
    "last_verified_at" TIMESTAMP(3),
    "reset_at" TIMESTAMP(3),

    CONSTRAINT "UserMfa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMfa_user_id_key" ON "UserMfa"("user_id");

-- AddForeignKey
ALTER TABLE "UserMfa" ADD CONSTRAINT "UserMfa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
