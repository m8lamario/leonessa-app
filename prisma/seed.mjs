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

  console.log(`Seed completato: ${schools.length} scuole disponibili.`);
}

main()
  .catch((error) => {
    console.error("Seed database fallito.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
