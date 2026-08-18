-- Add fantasy metadata to the existing player representation.
ALTER TABLE "TeamMember" ADD COLUMN "fantasyRole" TEXT NOT NULL DEFAULT 'CENTROCAMPISTA';
ALTER TABLE "TeamMember" ADD COLUMN "fantasyValue" INTEGER NOT NULL DEFAULT 25;

-- Keep the acquisition cost for the future market.
ALTER TABLE "FantasyTeamPlayer" ADD COLUMN "purchaseCost" INTEGER NOT NULL DEFAULT 0;
