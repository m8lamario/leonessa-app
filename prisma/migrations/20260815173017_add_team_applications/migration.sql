-- CreateEnum
CREATE TYPE "TeamApplicationKind" AS ENUM ('PLAYER', 'STAFF');

-- CreateEnum
CREATE TYPE "TeamApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TeamApplication" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "TeamApplicationKind" NOT NULL,
    "status" "TeamApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamApplication_teamId_status_submittedAt_idx" ON "TeamApplication"("teamId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "TeamApplication_userId_status_submittedAt_idx" ON "TeamApplication"("userId", "status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamApplication_teamId_userId_kind_key" ON "TeamApplication"("teamId", "userId", "kind");

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
