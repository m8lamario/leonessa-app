-- AlterTable
ALTER TABLE "PushDevice" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PushDevice" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "FollowedMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "matchId" TEXT,
    "notificationType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "linkUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowedMatch_userId_matchId_key" ON "FollowedMatch"("userId", "matchId");

-- CreateIndex
CREATE INDEX "FollowedMatch_matchId_idx" ON "FollowedMatch"("matchId");

-- CreateIndex
CREATE INDEX "FollowedMatch_userId_createdAt_idx" ON "FollowedMatch"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_idempotencyKey_key" ON "NotificationDelivery"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationDelivery_matchId_notificationType_idx" ON "NotificationDelivery"("matchId", "notificationType");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_createdAt_idx" ON "NotificationDelivery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_createdAt_idx" ON "NotificationDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PushDevice_userId_enabled_idx" ON "PushDevice"("userId", "enabled");

-- AddForeignKey
ALTER TABLE "FollowedMatch" ADD CONSTRAINT "FollowedMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowedMatch" ADD CONSTRAINT "FollowedMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PushDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
