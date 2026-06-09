CREATE TABLE "AdminAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "reach" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAnnouncement_status_idx" ON "AdminAnnouncement"("status");
CREATE INDEX "AdminAnnouncement_createdAt_idx" ON "AdminAnnouncement"("createdAt");
