ALTER TABLE "FantasyTeamPlayer"
ADD CONSTRAINT "FantasyTeamPlayer_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
