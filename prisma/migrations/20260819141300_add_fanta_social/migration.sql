-- CreateTable
CREATE TABLE "FantasyActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FantasyActivity_createdAt_idx" ON "FantasyActivity"("createdAt");
CREATE UNIQUE INDEX "FantasyAchievement_userId_code_key" ON "FantasyAchievement"("userId", "code");
CREATE INDEX "FantasyAchievement_userId_unlockedAt_idx" ON "FantasyAchievement"("userId", "unlockedAt");

-- AddForeignKey
ALTER TABLE "FantasyAchievement" ADD CONSTRAINT "FantasyAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
