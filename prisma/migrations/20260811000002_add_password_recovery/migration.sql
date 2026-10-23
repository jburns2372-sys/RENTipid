CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "identity_hash" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_token_hash_key"
    ON "PasswordResetToken"("token_hash");

CREATE INDEX "PasswordResetToken_user_id_created_at_idx"
    ON "PasswordResetToken"("user_id", "created_at");

CREATE INDEX "PasswordResetToken_expires_at_idx"
    ON "PasswordResetToken"("expires_at");

CREATE INDEX "PasswordResetRequest_identity_hash_requested_at_idx"
    ON "PasswordResetRequest"("identity_hash", "requested_at");

CREATE INDEX "PasswordResetRequest_ip_hash_requested_at_idx"
    ON "PasswordResetRequest"("ip_hash", "requested_at");

ALTER TABLE "PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
