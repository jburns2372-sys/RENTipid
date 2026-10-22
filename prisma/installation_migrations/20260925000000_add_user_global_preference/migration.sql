-- CreateTable
CREATE TABLE "UserGlobalPreference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "language_tag" TEXT NOT NULL DEFAULT 'en-PH',
    "country_code" TEXT NOT NULL DEFAULT 'PH',
    "display_currency" TEXT NOT NULL DEFAULT 'PHP',
    "is_manual_display_override" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGlobalPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGlobalPreference_user_id_key" ON "UserGlobalPreference"("user_id");

-- CreateIndex
CREATE INDEX "UserGlobalPreference_user_id_idx" ON "UserGlobalPreference"("user_id");

-- AddForeignKey
ALTER TABLE "UserGlobalPreference" ADD CONSTRAINT "UserGlobalPreference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
