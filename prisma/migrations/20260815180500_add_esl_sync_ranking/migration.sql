-- AlterTable
ALTER TABLE "School" ADD COLUMN "eslId" TEXT;
ALTER TABLE "Team" ADD COLUMN "eslId" TEXT;
ALTER TABLE "Match" ADD COLUMN "eslId" TEXT;
ALTER TABLE "Match" ADD COLUMN "rankingProcessed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SchoolRanking" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolRanking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_eslId_key" ON "School"("eslId");
CREATE UNIQUE INDEX "Team_eslId_key" ON "Team"("eslId");
CREATE UNIQUE INDEX "Match_eslId_key" ON "Match"("eslId");
CREATE UNIQUE INDEX "SchoolRanking_competitionId_schoolId_key"
    ON "SchoolRanking"("competitionId", "schoolId");
CREATE INDEX "SchoolRanking_competitionId_totalPoints_idx"
    ON "SchoolRanking"("competitionId", "totalPoints");
CREATE INDEX "SchoolRanking_schoolId_idx" ON "SchoolRanking"("schoolId");

-- AddForeignKey
ALTER TABLE "SchoolRanking"
    ADD CONSTRAINT "SchoolRanking_competitionId_fkey"
    FOREIGN KEY ("competitionId") REFERENCES "Competition"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolRanking"
    ADD CONSTRAINT "SchoolRanking_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
