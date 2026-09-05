-- AlterEnum
ALTER TYPE "PointSourceType" ADD VALUE IF NOT EXISTS 'MATCH_PREDICTION';

-- CreateEnum
CREATE TYPE "MatchPredictionChoice" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "MatchPredictionStatus" AS ENUM ('OPEN', 'LOCKED', 'SETTLED_CORRECT', 'SETTLED_WRONG', 'VOID');

-- CreateTable
CREATE TABLE "MatchPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "choice" "MatchPredictionChoice" NOT NULL,
    "status" "MatchPredictionStatus" NOT NULL DEFAULT 'OPEN',
    "chosenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "resultChoice" "MatchPredictionChoice",
    "rewardAmount" INTEGER,
    "pointTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchPrediction_pointTransactionId_key" ON "MatchPrediction"("pointTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPrediction_userId_matchId_key" ON "MatchPrediction"("userId", "matchId");

-- CreateIndex
CREATE INDEX "MatchPrediction_matchId_status_idx" ON "MatchPrediction"("matchId", "status");

-- CreateIndex
CREATE INDEX "MatchPrediction_userId_status_idx" ON "MatchPrediction"("userId", "status");

-- CreateIndex
CREATE INDEX "MatchPrediction_status_settledAt_idx" ON "MatchPrediction"("status", "settledAt");

-- CreateIndex
CREATE INDEX "User_name_surname_idx" ON "User"("name", "surname");

-- AddForeignKey
ALTER TABLE "MatchPrediction" ADD CONSTRAINT "MatchPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPrediction" ADD CONSTRAINT "MatchPrediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
