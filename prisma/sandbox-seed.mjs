import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic pseudo-random for reproducible data.
function seededRandom(seed) {
  let t = seed;
  return () => {
    t = (t * 1103515245 + 12345) & 0x7fffffff;
    return t / 0x7fffffff;
  };
}

const SCHOOL_DATA = [
  {
    name: "ITIS Castelli",
    shortName: "CASTELLI",
    primaryColor: "#163A5F",
    secondaryColor: "#F0A202",
  },
  {
    name: "Liceo Copernico",
    shortName: "COPERNICO",
    primaryColor: "#0B1F3A",
    secondaryColor: "#2E80D9",
  },
  { name: "Abba Ballini", shortName: "ABBA", primaryColor: "#4B1D3F", secondaryColor: "#C89B3C" },
  { name: "Olivieri", shortName: "OLIVIERI", primaryColor: "#123B70", secondaryColor: "#2E80D9" },
  { name: "Lunardi", shortName: "LUN", primaryColor: "#163A5F", secondaryColor: "#F0A202" },
  {
    name: "Liceo Marco Polo",
    shortName: "LMP",
    primaryColor: "#0B1F3A",
    secondaryColor: "#2E80D9",
  },
  { name: "Calvesi/Baracca", shortName: "LCB", primaryColor: "#4B1D3F", secondaryColor: "#C89B3C" },
  { name: "Liceo Leonardo", shortName: "LEO", primaryColor: "#123B70", secondaryColor: "#2E80D9" },
];

const FIRST_NAMES = [
  "Marco",
  "Giulia",
  "Luca",
  "Anna",
  "Matteo",
  "Sofia",
  "Davide",
  "Chiara",
  "Simone",
  "Elena",
  "Nicolò",
  "Giulia",
  "Alessandro",
  "Martina",
  "Tommaso",
  "Beatrice",
];
const SURNAMES = [
  "Rossi",
  "Bianchi",
  "Verdi",
  "Ferrari",
  "Esposito",
  "Colombo",
  "Ricci",
  "Marino",
  "Galli",
  "Conti",
  "Romano",
  "Greco",
  "Bruno",
  "Costa",
  "Fontana",
  "Rizzo",
];

const ROLES = [
  "PORTIERE",
  "DIFENSORE",
  "DIFENSORE",
  "DIFENSORE",
  "DIFENSORE",
  "CENTROCAMPISTA",
  "CENTROCAMPISTA",
  "CENTROCAMPISTA",
  "ATTACCANTE",
  "ATTACCANTE",
  "ATTACCANTE",
];
const BASE_VALUES = { PORTIERE: 20, DIFENSORE: 25, CENTROCAMPISTA: 30, ATTACCANTE: 35 };

const LEONESSA_SLUG = "leonessa-cup-sandbox";

async function upsertSchools() {
  const records = [];
  for (const school of SCHOOL_DATA) {
    const record = await prisma.school.upsert({
      where: { shortName: school.shortName },
      update: {
        name: school.name,
        primaryColor: school.primaryColor,
        secondaryColor: school.secondaryColor,
        description: "Scuola simulata Sandbox Leonessa.",
        deletedAt: null,
      },
      create: {
        name: school.name,
        shortName: school.shortName,
        primaryColor: school.primaryColor,
        secondaryColor: school.secondaryColor,
        description: "Scuola simulata Sandbox Leonessa.",
      },
    });
    records.push(record);
  }
  return records;
}

async function upsertCompetition(schools) {
  const competition = await prisma.competition.upsert({
    where: { slug: LEONESSA_SLUG },
    update: {
      status: "ACTIVE",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
      deletedAt: null,
    },
    create: {
      name: "Leonessa Cup Sandbox",
      slug: LEONESSA_SLUG,
      season: "2026",
      status: "ACTIVE",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
    },
  });

  const teams = [];
  for (const school of schools) {
    const team = await prisma.team.upsert({
      where: {
        competitionId_name: { competitionId: competition.id, name: `Sandbox ${school.shortName}` },
      },
      update: { schoolId: school.id, deletedAt: null },
      create: {
        competitionId: competition.id,
        schoolId: school.id,
        name: `Sandbox ${school.shortName}`,
      },
    });
    teams.push(team);
  }
  return { competition, teams };
}

async function generateUsers() {
  const users = [];
  for (let index = 0; index < 20; index++) {
    const email = `sandbox-user-${index}@leonessacup.test`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { deletedAt: null },
      create: {
        email,
        name: FIRST_NAMES[index % FIRST_NAMES.length],
        surname: `${SURNAMES[(index + 3) % SURNAMES.length]} ${index}`,
        className: `${1 + (index % 5)}${index % 2 === 0 ? "A" : "B"}`,
      },
    });
    users.push(user);
  }
  return users;
}

async function generatePlayers(schools, teams, random) {
  const players = [];
  const teamJersey = new Map(); // teamId -> next jersey
  let index = 0;
  for (const fantasyRole of ROLES) {
    for (let round = 0; round < 5; round++) {
      index += 1;
      const school = schools[index % schools.length];
      const team = teams[index % teams.length];
      const email = `sandbox-player-${index}@leonessacup.test`;
      const user = await prisma.user.upsert({
        where: { email },
        update: { deletedAt: null },
        create: {
          email,
          name: FIRST_NAMES[index % FIRST_NAMES.length],
          surname: `${SURNAMES[index % SURNAMES.length]} ${index}`,
          schoolId: school.id,
        },
      });
      const jersey = teamJersey.get(team.id) ?? 1;
      teamJersey.set(team.id, jersey + 1);
      const teamMember = await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
        update: {
          role: "PLAYER",
          leftAt: null,
          fantasyRole,
          fantasyValue: BASE_VALUES[fantasyRole] + Math.floor(random() * 20),
          jerseyNumber: null,
          schoolYear: `${1 + Math.floor(random() * 5)}`,
        },
        create: {
          teamId: team.id,
          userId: user.id,
          role: "PLAYER",
          fantasyRole,
          fantasyValue: BASE_VALUES[fantasyRole] + Math.floor(random() * 20),
          jerseyNumber: null,
          schoolYear: `${1 + Math.floor(random() * 5)}`,
        },
      });
      players.push(teamMember);
    }
  }
  return players;
}

async function generateFantasyTeams(users, players, random) {
  const teams = [];
  for (const user of users) {
    // Pick 15 distinct players: 11 starters (1-4-3-3) + 4 bench (1 per role).
    const gk = players.filter((p) => p.fantasyRole === "PORTIERE");
    const def = players.filter((p) => p.fantasyRole === "DIFENSORE");
    const mid = players.filter((p) => p.fantasyRole === "CENTROCAMPISTA");
    const att = players.filter((p) => p.fantasyRole === "ATTACCANTE");

    const pickUnique = (arr, used) => {
      const available = arr.filter((player) => !used.has(player.id));
      const player = available[Math.floor(random() * available.length)];
      if (player) used.add(player.id);
      return player;
    };
    const used = new Set();
    const starters = [pickUnique(gk, used)];
    for (let i = 0; i < 4; i++) starters.push(pickUnique(def, used));
    for (let i = 0; i < 3; i++) starters.push(pickUnique(mid, used));
    for (let i = 0; i < 3; i++) starters.push(pickUnique(att, used));
    const bench = [
      pickUnique(gk, used),
      pickUnique(def, used),
      pickUnique(mid, used),
      pickUnique(att, used),
    ];

    const uniqueStarters = starters.filter(Boolean);
    const uniqueBench = bench.filter(Boolean);
    const uniqueRoster = [...uniqueStarters, ...uniqueBench];

    const captain = uniqueStarters[Math.floor(random() * uniqueStarters.length)];
    const cost = uniqueRoster.reduce((sum, p) => sum + p.fantasyValue, 0);

    const team = await prisma.fantasyTeam.upsert({
      where: { userId: user.id },
      update: { budgetLp: 500 - cost + 100 },
      create: {
        userId: user.id,
        name: `Sandbox ${user.name} Fifteen`,
        budgetLp: Math.max(0, 500 - cost),
      },
    });

    await prisma.fantasyTeamPlayer.deleteMany({ where: { fantasyTeamId: team.id } });
    for (const player of uniqueStarters) {
      await prisma.fantasyTeamPlayer.create({
        data: {
          fantasyTeamId: team.id,
          playerId: player.id,
          role: player.fantasyRole,
          status: "STARTER",
          benchOrder: null,
          purchaseCost: player.fantasyValue,
          isCaptain: player.id === captain.id,
        },
      });
    }
    for (const [index, player] of uniqueBench.entries()) {
      await prisma.fantasyTeamPlayer.create({
        data: {
          fantasyTeamId: team.id,
          playerId: player.id,
          role: player.fantasyRole,
          status: "BENCH",
          benchOrder: index,
          purchaseCost: player.fantasyValue,
          isCaptain: false,
        },
      });
    }
    teams.push(team);
  }
  return teams;
}

async function generateFantasyStatsAndScores(fantasyTeams, players, random) {
  for (const player of players) {
    const goals = Math.floor(random() * 4);
    const assists = Math.floor(random() * 3);
    const matches = 1 + Math.floor(random() * 5);
    const totalPoints = goals * 100 + assists * 50 + matches * 25;
    await prisma.fantasyPlayerStat.upsert({
      where: { playerId: player.id },
      update: { goals, assists, matches, totalPoints },
      create: { playerId: player.id, goals, assists, matches, totalPoints },
    });
  }

  const matchday = await prisma.fantasyMatchday.upsert({
    where: { round: 20260820 },
    update: {
      startedAt: new Date("2026-08-19T18:00:00.000Z"),
      completedAt: new Date("2026-08-19T20:00:00.000Z"),
    },
    create: {
      round: 20260820,
      startedAt: new Date("2026-08-19T18:00:00.000Z"),
      completedAt: new Date("2026-08-19T20:00:00.000Z"),
    },
  });
  for (const team of fantasyTeams) {
    const points = 100 + Math.floor(random() * 500);
    await prisma.fantasyScore.upsert({
      where: { fantasyTeamId_matchdayId: { fantasyTeamId: team.id, matchdayId: matchday.id } },
      update: { points },
      create: { fantasyTeamId: team.id, matchdayId: matchday.id, points },
    });
    await prisma.fantasyTeam.update({ where: { id: team.id }, data: { totalPoints: points } });
  }
}

async function generateMatches(competition, teams, random) {
  // Create a round-robin ladder of completed matches across a few matchdays.
  const matches = [];
  let day = 1;
  for (let i = 0; i < teams.length - 1; i++) {
    const home = teams[i % teams.length];
    const away = teams[(i + 1) % teams.length];
    const match = await prisma.match.create({
      data: {
        competitionId: competition.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        startAt: new Date(2026, 0, 1 + day, 15, 0),
        status: "FINISHED",
        homeScore: Math.floor(random() * 4),
        awayScore: Math.floor(random() * 4),
      },
    });
    matches.push(match);
    day += 1;
  }
  return matches;
}

async function cleanupSandboxData() {
  // Keep production fantasy data untouched; only remove rows owned by sandbox users/competition.
  const sandboxUsers = await prisma.user.findMany({
    where: { email: { startsWith: "sandbox-" } },
    select: { id: true },
  });
  const sandboxUserIds = sandboxUsers.map((user) => user.id);
  const sandboxTeams = await prisma.fantasyTeam.findMany({
    where: { userId: { in: sandboxUserIds } },
    select: { id: true },
  });
  const sandboxFantasyTeamIds = sandboxTeams.map((team) => team.id);
  const sandboxPlayers = await prisma.teamMember.findMany({
    where: { team: { competition: { slug: LEONESSA_SLUG } } },
    select: { id: true },
  });
  const sandboxPlayerIds = sandboxPlayers.map((player) => player.id);
  const sandboxMatches = await prisma.match.findMany({
    where: { competition: { slug: LEONESSA_SLUG } },
    select: { id: true },
  });
  const sandboxMatchIds = sandboxMatches.map((match) => match.id);

  await prisma.fantasyAchievement.deleteMany({ where: { userId: { in: sandboxUserIds } } });
  await prisma.fantasyScore.deleteMany({ where: { fantasyTeamId: { in: sandboxFantasyTeamIds } } });
  await prisma.fantasySubstitution.deleteMany({
    where: { fantasyTeamId: { in: sandboxFantasyTeamIds } },
  });
  await prisma.fantasyTeamTransfer.deleteMany({
    where: { fantasyTeamId: { in: sandboxFantasyTeamIds } },
  });
  await prisma.fantasyTeamPlayer.deleteMany({
    where: { fantasyTeamId: { in: sandboxFantasyTeamIds } },
  });
  await prisma.fantasyTeam.deleteMany({ where: { id: { in: sandboxFantasyTeamIds } } });
  await prisma.fantasyPlayerValueHistory.deleteMany({
    where: { playerId: { in: sandboxPlayerIds } },
  });
  await prisma.fantasyPlayerStat.deleteMany({ where: { playerId: { in: sandboxPlayerIds } } });
  await prisma.fantasyProcessedMatch.deleteMany({ where: { matchId: { in: sandboxMatchIds } } });
  await prisma.fantasyActivity.deleteMany({ where: { title: { contains: "Sandbox" } } });
  await prisma.matchEvent.deleteMany({ where: { matchId: { in: sandboxMatchIds } } });
  await prisma.match.deleteMany({ where: { id: { in: sandboxMatchIds } } });
  await prisma.event.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
  await prisma.newsArticle.deleteMany({ where: { slug: { startsWith: "sandbox-" } } });
  await prisma.notification.deleteMany({ where: { userId: { in: sandboxUserIds } } });
  // Player users/team members may be referenced by non-sandbox fantasy teams; keep them for isolation.
  await prisma.user.deleteMany({ where: { email: { startsWith: "sandbox-user-" } } });
}

async function main() {
  if (process.env.APP_SANDBOX_MODE !== "true") {
    throw new Error("Sandbox disabled. Set APP_SANDBOX_MODE=true before running sandbox:seed.");
  }
  console.log("[SIMULATION] Sandbox seed started");
  const random = seededRandom(2026);

  await cleanupSandboxData();
  const schools = await upsertSchools();
  const { competition, teams } = await upsertCompetition(schools);
  const users = await generateUsers();
  const players = await generatePlayers(schools, teams, random);
  const fantasyTeams = await generateFantasyTeams(users, players, random);
  const matches = await generateMatches(competition, teams, random);
  await generateFantasyStatsAndScores(fantasyTeams, players, random);

  // News + Events
  await prisma.newsArticle.create({
    data: {
      competitionId: competition.id,
      title: "Benvenuti nella Sandbox Leonessa",
      slug: `sandbox-welcome-${Date.now()}`,
      excerpt: "Contenuto di test.",
      content: "Questa è una notizia simulata generata dal sistema Sandbox.",
      type: "ARTICLE",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
  await prisma.event.create({
    data: {
      competitionId: competition.id,
      title: "Giornata Sandbox",
      startAt: new Date(2026, 0, 5, 18, 0),
    },
  });

  console.log(
    `[SIMULATION] Users: ${users.length}, Players: ${players.length}, FantasyTeams: ${fantasyTeams.length}, Matches: ${matches.length}`,
  );
  console.log(`[SIMULATION] News: 1, Events: 1`);
  console.log("[SIMULATION] Sandbox seed completed");
}

main()
  .catch((error) => {
    console.error("[SIMULATION] Sandbox seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
