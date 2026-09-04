-- AlterEnum
ALTER TYPE "PointSourceType" ADD VALUE IF NOT EXISTS 'REWARD_REDEMPTION';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'REWARD_REDEMPTION';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ECONOMY_CONFIG_UPDATE';

-- CreateEnum
CREATE TYPE "RewardRedemptionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'merchandise',
    "costLp" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "stock" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "conditions" TEXT,
    "maxPerUser" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "costLp" INTEGER NOT NULL,
    "status" "RewardRedemptionStatus" NOT NULL DEFAULT 'COMPLETED',
    "code" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomyRewardConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "rewardLp" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomyRewardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomyConfigHistory" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "actorId" TEXT,
    "oldValue" INTEGER NOT NULL,
    "newValue" INTEGER NOT NULL,
    "oldEnabled" BOOLEAN NOT NULL,
    "newEnabled" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomyConfigHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reward_active_displayOrder_idx" ON "Reward"("active", "displayOrder");

-- CreateIndex
CREATE INDEX "Reward_category_active_idx" ON "Reward"("category", "active");

-- CreateIndex
CREATE INDEX "Reward_deletedAt_idx" ON "Reward"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRedemption_code_key" ON "RewardRedemption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRedemption_idempotencyKey_key" ON "RewardRedemption"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RewardRedemption_userId_createdAt_idx" ON "RewardRedemption"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardRedemption_rewardId_status_idx" ON "RewardRedemption"("rewardId", "status");

-- CreateIndex
CREATE INDEX "RewardRedemption_status_createdAt_idx" ON "RewardRedemption"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EconomyRewardConfig_key_key" ON "EconomyRewardConfig"("key");

-- CreateIndex
CREATE INDEX "EconomyRewardConfig_enabled_idx" ON "EconomyRewardConfig"("enabled");

-- CreateIndex
CREATE INDEX "EconomyConfigHistory_configId_createdAt_idx" ON "EconomyConfigHistory"("configId", "createdAt");

-- CreateIndex
CREATE INDEX "EconomyConfigHistory_actorId_createdAt_idx" ON "EconomyConfigHistory"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomyConfigHistory" ADD CONSTRAINT "EconomyConfigHistory_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EconomyRewardConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomyConfigHistory" ADD CONSTRAINT "EconomyConfigHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
