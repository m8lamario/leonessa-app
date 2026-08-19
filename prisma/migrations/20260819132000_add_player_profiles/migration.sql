-- Player profile metadata
ALTER TABLE "TeamMember" ADD COLUMN "schoolYear" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN "isVerifiedPlayer" BOOLEAN NOT NULL DEFAULT false;
