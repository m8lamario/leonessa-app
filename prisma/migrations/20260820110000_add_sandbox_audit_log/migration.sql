CREATE TABLE "SandboxAuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SandboxAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SandboxAuditLog_createdAt_idx" ON "SandboxAuditLog"("createdAt");
CREATE INDEX "SandboxAuditLog_adminId_createdAt_idx" ON "SandboxAuditLog"("adminId", "createdAt");
ALTER TABLE "SandboxAuditLog" ADD CONSTRAINT "SandboxAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
