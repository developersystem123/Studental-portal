-- Add googleId column for storing the Google OAuth subject identifier.
-- Nullable so existing users (email/password) are not affected.
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
