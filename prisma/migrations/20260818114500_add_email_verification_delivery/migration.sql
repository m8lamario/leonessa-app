-- CreateEnum
CREATE TYPE "EmailVerificationDeliveryKind" AS ENUM ('INITIAL', 'RESEND');

-- CreateTable
CREATE TABLE "EmailVerificationDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "EmailVerificationDeliveryKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailVerificationDelivery_userId_createdAt_idx" ON "EmailVerificationDelivery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailVerificationDelivery_userId_kind_createdAt_idx" ON "EmailVerificationDelivery"("userId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailVerificationDelivery" ADD CONSTRAINT "EmailVerificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
