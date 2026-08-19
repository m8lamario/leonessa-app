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
  for (let index = 0; index < 12; index++) {
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
          jerseyNumber: jersey,
          schoolYear: `${1 + Math.floor(random() * 5)}`,
        },
        create: {
          teamId: team.id,
          userId: user.id,
          role: "PLAYER",
          fantasyRole,
          fantasyValue: BASE_VALUES[fantasyRole] + Math.floor(random() * 20),
          jerseyNumber: jersey,
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
    // Pick 11 distinct players maintaining formation: 1 GK, 4 DEF, 3 MID, 3 ATT.
    const gk = players.filter((p) => p.fantasyRole === "PORTIERE");
    const def = players.filter((p) => p.fantasyRole === "DIFENSORE");
    const mid = players.filter((p) => p.fantasyRole === "CENTROCAMPISTA");
    const att = players.filter((p) => p.fantasyRole === "ATTACCANTE");

    const pick = (arr) => arr[Math.floor(random() * arr.length)];
    const roster = [pick(gk)];
    for (let i = 0; i < 4; i++) roster.push(pick(def));
    for (let i = 0; i < 3; i++) roster.push(pick(mid));
    for (let i = 0; i < 3; i++) roster.push(pick(att));

    const uniqueRoster = [...new Map(roster.map((p) => [p.id, p])).values()];

    const captain = uniqueRoster[Math.floor(random() * uniqueRoster.length)];
    const cost = uniqueRoster.reduce((sum, p) => sum + p.fantasyValue, 0);

    const team = await prisma.fantasyTeam.upsert({
      where: { userId: user.id },
      update: { budgetLp: 500 - cost + 100 },
      create: {
        userId: user.id,
        name: `Sandbox ${user.name} Eleven`,
        budgetLp: Math.max(0, 500 - cost),
      },
    });

    await prisma.fantasyTeamPlayer.deleteMany({ where: { fantasyTeamId: team.id } });
    for (const player of uniqueRoster) {
      await prisma.fantasyTeamPlayer.create({
        data: {
          fantasyTeamId: team.id,
          playerId: player.id,
          role: player.fantasyRole,
          purchaseCost: player.fantasyValue,
          isCaptain: player.id === captain.id,
        },
      });
    }
    teams.push(team);
  }
  return teams;
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
  // Order matters to satisfy FK constraints (RESTRICT on TeamMember references).
  await prisma.fantasyAchievement.deleteMany();
  await prisma.fantasyActivity.deleteMany();
  await prisma.fantasyScore.deleteMany();
  await prisma.fantasyMatchday.deleteMany();
  await prisma.fantasyProcessedMatch.deleteMany();
  await prisma.fantasyTeamTransfer.deleteMany();
  await prisma.fantasyTeamPlayer.deleteMany();
  await prisma.fantasyTeam.deleteMany();
  await prisma.fantasyPlayerValueHistory.deleteMany();
  await prisma.fantasyPlayerStat.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
  await prisma.event.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
  await prisma.newsArticle.deleteMany({ where: { slug: { startsWith: "sandbox-" } } });
  await prisma.notification.deleteMany({
    where: { user: { email: { startsWith: "sandbox-" } } },
  });
  await prisma.teamMember.deleteMany({ where: { team: { competition: { slug: LEONESSA_SLUG } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "sandbox-" } } });
  await prisma.team.deleteMany({ where: { competition: { slug: LEONESSA_SLUG } } });
}

async function main() {
  console.log("[SIMULATION] Sandbox seed started");
  const random = seededRandom(2026);

  await cleanupSandboxData();
  const schools = await upsertSchools();
  const { competition, teams } = await upsertCompetition(schools);
  const users = await generateUsers();
  const players = await generatePlayers(schools, teams, random);
  const fantasyTeams = await generateFantasyTeams(users, players, random);
  const matches = await generateMatches(competition, teams, random);

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
