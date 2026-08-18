-- AlterTable
ALTER TABLE "Mission" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Mission_slug_key" ON "Mission"("slug");
