-- Add privacy and accessibility preference columns to UserSettings.
-- Both have safe defaults so existing rows are unaffected.
ALTER TABLE "UserSettings"
    ADD COLUMN IF NOT EXISTS "profilePublic"    BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "reduceAnimations" BOOLEAN NOT NULL DEFAULT false;
