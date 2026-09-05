-- CreateEnum
CREATE TYPE "SponsorLeagueStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SponsorLeagueScoringRule" AS ENUM ('LP_EARNED_DURING_LEAGUE');

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorLeague" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "SponsorLeagueStatus" NOT NULL DEFAULT 'DRAFT',
    "enrollmentOpen" BOOLEAN NOT NULL DEFAULT false,
    "scoringRule" "SponsorLeagueScoringRule" NOT NULL DEFAULT 'LP_EARNED_DURING_LEAGUE',
    "prizeTitle" TEXT NOT NULL,
    "prizeDescription" TEXT,
    "awardedPositions" INTEGER NOT NULL DEFAULT 1,
    "conditionsText" TEXT,
    "conditions" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SponsorLeague_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorLeagueMember" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorLeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_active_deletedAt_idx" ON "Partner"("active", "deletedAt");

-- CreateIndex
CREATE INDEX "Partner_deletedAt_idx" ON "Partner"("deletedAt");

-- CreateIndex
CREATE INDEX "SponsorLeague_status_startAt_idx" ON "SponsorLeague"("status", "startAt");

-- CreateIndex
CREATE INDEX "SponsorLeague_partnerId_idx" ON "SponsorLeague"("partnerId");

-- CreateIndex
CREATE INDEX "SponsorLeague_deletedAt_idx" ON "SponsorLeague"("deletedAt");

-- CreateIndex
CREATE INDEX "SponsorLeague_createdById_idx" ON "SponsorLeague"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorLeagueMember_leagueId_userId_key" ON "SponsorLeagueMember"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "SponsorLeagueMember_userId_joinedAt_idx" ON "SponsorLeagueMember"("userId", "joinedAt");

-- CreateIndex
CREATE INDEX "SponsorLeagueMember_leagueId_joinedAt_idx" ON "SponsorLeagueMember"("leagueId", "joinedAt");

-- AddForeignKey
ALTER TABLE "SponsorLeague" ADD CONSTRAINT "SponsorLeague_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorLeague" ADD CONSTRAINT "SponsorLeague_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorLeagueMember" ADD CONSTRAINT "SponsorLeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "SponsorLeague"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorLeagueMember" ADD CONSTRAINT "SponsorLeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
