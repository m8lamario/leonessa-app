-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PointSourceType" ADD VALUE 'DAILY_LOGIN';
ALTER TYPE "PointSourceType" ADD VALUE 'STREAK';
ALTER TYPE "PointSourceType" ADD VALUE 'SCHOOL_RESULT';
ALTER TYPE "PointSourceType" ADD VALUE 'REFERRAL';

-- AlterEnum
ALTER TYPE "PointType" ADD VALUE 'SSP';

-- AlterTable
ALTER TABLE "PointTransaction" ADD COLUMN     "schoolId" TEXT;

-- CreateTable
CREATE TABLE "UserLPBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLPBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSupportBalance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSupportBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserLPBalance_userId_key" ON "UserLPBalance"("userId");

-- CreateIndex
CREATE INDEX "UserLPBalance_balance_idx" ON "UserLPBalance"("balance");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSupportBalance_schoolId_key" ON "SchoolSupportBalance"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolSupportBalance_points_idx" ON "SchoolSupportBalance"("points");

-- CreateIndex
CREATE INDEX "PointTransaction_schoolId_type_createdAt_idx" ON "PointTransaction"("schoolId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLPBalance" ADD CONSTRAINT "UserLPBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSupportBalance" ADD CONSTRAINT "SchoolSupportBalance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
