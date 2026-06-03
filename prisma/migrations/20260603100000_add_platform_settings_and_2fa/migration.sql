-- Add PlatformSetting table for global admin-configurable settings
CREATE TABLE "PlatformSetting" (
    "key"       TEXT NOT NULL,
    "value"     JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- Add TOTP 2FA fields to User
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "totpSecret"  TEXT,
    ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
