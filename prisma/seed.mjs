import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const schools = [
  {
    name: "Liceo Scientifico Statale Annibale Calini",
    shortName: "CALINI",
    primaryColor: "#123B70",
    secondaryColor: "#2E80D9",
    description: "Scuola superiore di Brescia.",
  },
  {
    name: "Liceo Scientifico Statale Nicolò Copernico",
    shortName: "COPERNICO",
    primaryColor: "#0B1F3A",
    secondaryColor: "#2E80D9",
    description: "Scuola superiore di Brescia.",
  },
  {
    name: "Liceo Classico Statale Arnaldo",
    shortName: "ARNALDO",
    primaryColor: "#4B1D3F",
    secondaryColor: "#C89B3C",
    description: "Scuola superiore di Brescia.",
  },
  {
    name: "Istituto di Istruzione Superiore Castelli",
    shortName: "CASTELLI",
    primaryColor: "#163A5F",
    secondaryColor: "#F0A202",
    description: "Istituto superiore di Brescia.",
  },
];

async function main() {
  for (const school of schools) {
    await prisma.school.upsert({
      where: { shortName: school.shortName },
      update: {
        name: school.name,
        primaryColor: school.primaryColor,
        secondaryColor: school.secondaryColor,
        description: school.description,
        deletedAt: null,
      },
      create: school,
    });
  }

  const competition = await prisma.competition.upsert({
    where: { slug: "leonessa-cup-2026" },
    update: { deletedAt: null },
    create: {
      name: "Leonessa Cup 2026",
      slug: "leonessa-cup-2026",
      season: "2026",
      status: "UPCOMING",
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: new Date("2027-06-30T00:00:00.000Z"),
    },
  });

  const schoolRecords = await prisma.school.findMany({ orderBy: { shortName: "asc" } });
  const teams = await Promise.all(
    schoolRecords.map((school) =>
      prisma.team.upsert({
        where: {
          competitionId_name: {
            competitionId: competition.id,
            name: `Leonessa ${school.shortName}`,
          },
        },
        update: { deletedAt: null },
        create: {
          competitionId: competition.id,
          schoolId: school.id,
          name: `Leonessa ${school.shortName}`,
        },
      }),
    ),
  );

  const roles = [
    ...Array(5).fill("PORTIERE"),
    ...Array(15).fill("DIFENSORE"),
    ...Array(10).fill("CENTROCAMPISTA"),
    ...Array(10).fill("ATTACCANTE"),
  ];
  const firstNames = [
    "Andrea",
    "Luca",
    "Marco",
    "Matteo",
    "Davide",
    "Simone",
    "Nicolò",
    "Gabriele",
    "Alessandro",
    "Tommaso",
  ];
  const surnames = [
    "Rossi",
    "Bianchi",
    "Romano",
    "Ferrari",
    "Esposito",
    "Colombo",
    "Ricci",
    "Marino",
    "Galli",
    "Conti",
  ];
  const baseValues = { PORTIERE: 20, DIFENSORE: 25, CENTROCAMPISTA: 35, ATTACCANTE: 45 };

  await Promise.all(
    roles.map(async (fantasyRole, index) => {
      const school = schoolRecords[index % schoolRecords.length];
      const team = teams[index % teams.length];
      const email = `fanta-player-${String(index + 1).padStart(2, "0")}@leonessacup.test`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name: firstNames[index % firstNames.length],
          surname: `${surnames[index % surnames.length]} ${index + 1}`,
          schoolId: school.id,
          deletedAt: null,
        },
        create: {
          email,
          name: firstNames[index % firstNames.length],
          surname: `${surnames[index % surnames.length]} ${index + 1}`,
          schoolId: school.id,
        },
      });
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
        update: {
          role: "PLAYER",
          leftAt: null,
          fantasyRole,
          fantasyValue: baseValues[fantasyRole] + (index % 5) * 5,
        },
        create: {
          teamId: team.id,
          userId: user.id,
          role: "PLAYER",
          fantasyRole,
          fantasyValue: baseValues[fantasyRole] + (index % 5) * 5,
        },
      });
    }),
  );

  console.log(
    `Seed completato: ${schools.length} scuole e ${roles.length} giocatori Fanta disponibili.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed database fallito.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
