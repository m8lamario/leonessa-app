import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Inizio caricamento seed DEMO Economy & Rewards...");

  // 1. Configurazione Economy DEMO
  const demoConfigs = [
    {
      key: "referral.completion",
      title: "[DEMO] Referral Convalidato",
      description: "LP assegnati per ogni amico invitato che completa la registrazione",
      category: "referral",
      rewardLp: 50,
      enabled: true,
    },
    {
      key: "event.checkin",
      title: "[DEMO] Check-in Evento",
      description: "LP assegnati tramite scansione QR all'ingresso della partita o evento",
      category: "events",
      rewardLp: 25,
      enabled: true,
    },
    {
      key: "mission.daily",
      title: "[DEMO] Missione Giornaliera",
      description: "LP assegnati al completamento della missione del giorno",
      category: "missions",
      rewardLp: 10,
      enabled: true,
    },
    {
      key: "achievement.unlock",
      title: "[DEMO] Achievement Sbloccato",
      description: "LP bonus al raggiungimento di un trofeo o traguardo",
      category: "achievements",
      rewardLp: 100,
      enabled: true,
    },
    {
      key: "match.participation",
      title: "[DEMO] Partecipazione Partita",
      description: "LP per partecipazione attiva a un match Leonessa",
      category: "matches",
      rewardLp: 20,
      enabled: true,
    },
    {
      key: "promo.seasonal.disabled",
      title: "[DEMO] Bonus Stagionale (Disattivato)",
      description: "Fonte promozionale temporanea disattivata per test stato disabled",
      category: "promotions",
      rewardLp: 200,
      enabled: false,
    },
  ];

  for (const cfg of demoConfigs) {
    await prisma.economyRewardConfig.upsert({
      where: { key: cfg.key },
      update: {
        title: cfg.title,
        description: cfg.description,
        category: cfg.category,
        rewardLp: cfg.rewardLp,
        enabled: cfg.enabled,
      },
      create: cfg,
    });
  }
  console.log(`Configurazioni Economy DEMO salvate: ${demoConfigs.length}`);

  // 2. Catalogo Rewards DEMO
  // 1: Economico (100 LP, stock disponibile)
  // 2: Medio (500 LP, stock limitato)
  // 3: Costoso (2000 LP, stock disponibile)
  // 4: Senza stock (stock 0, non riscattabile)
  // 5: Disattivato (active: false, non riscattabile)
  // 6: Senza stock limitato (stock: null, illimitato)
  // 7: Con condizione (conditions presente, es. ritiro info-point / riservato studenti)
  const demoRewards = [
    {
      name: "[DEMO] Sconto 10% Bar Leonessa",
      description: "Buono sconto per colazione o aperitivo presso il bar convenzionato.",
      category: "partner",
      costLp: 100,
      imageUrl: null,
      stock: 50,
      active: true,
      conditions: "Valido entro 30 giorni dal riscatto",
      maxPerUser: 5,
      displayOrder: 1,
    },
    {
      name: "[DEMO] Sacca Sportiva Leonessa",
      description: "Sacca gym impermeabile ufficiale Leonessa Cup in edizione limitata.",
      category: "merchandise",
      costLp: 500,
      imageUrl: null,
      stock: 5, // Stock limitato
      active: true,
      conditions: "Ritiro presso il desk accrediti",
      maxPerUser: 2,
      displayOrder: 2,
    },
    {
      name: "[DEMO] Felpa Ufficiale Leonessa",
      description: "Felpa con cappuccio ufficiale Leonessa Cup 2026, taglia a scelta.",
      category: "merchandise",
      costLp: 2000,
      imageUrl: null,
      stock: 20,
      active: true,
      conditions: "Ritiro e prova taglia al quartier generale",
      maxPerUser: 1,
      displayOrder: 3,
    },
    {
      name: "[DEMO] Tazza Termica Leonessa (Esaurito)",
      description: "Tazza termica brandizzata in acciaio inox (prodotto esaurito).",
      category: "merchandise",
      costLp: 300,
      imageUrl: null,
      stock: 0, // Stock 0 (esaurito)
      active: true,
      conditions: "Attualmente non disponibile",
      maxPerUser: 1,
      displayOrder: 4,
    },
    {
      name: "[DEMO] Biglietto VIP Finale (Disattivato)",
      description: "Accesso all'area hospitality per la finale (non attivo).",
      category: "events",
      costLp: 1500,
      imageUrl: null,
      stock: 10,
      active: false, // Disattivato
      conditions: "Premio temporaneamente sospeso",
      maxPerUser: 1,
      displayOrder: 5,
    },
    {
      name: "[DEMO] Wallpaper & Badge Digitale",
      description: "Pack grafiche esclusive per smartphone e trofeo digitale nella community.",
      category: "digital",
      costLp: 50,
      imageUrl: null,
      stock: null, // Disponibilità illimitata
      active: true,
      conditions: null,
      maxPerUser: 1,
      displayOrder: 6,
    },
    {
      name: "[DEMO] Pass Allenamento con i Coach",
      description: "Esperienza esclusiva sul campo con i tecnici Leonessa prima delle finali.",
      category: "experience",
      costLp: 800,
      imageUrl: null,
      stock: 3,
      active: true,
      conditions: "Riservato a studenti regolarmente iscritti; mostrare badge all'ingresso",
      maxPerUser: 1,
      displayOrder: 7,
    },
  ];

  const createdRewards = [];
  for (const rew of demoRewards) {
    const existing = await prisma.reward.findFirst({
      where: { name: rew.name, deletedAt: null },
    });
    if (existing) {
      const updated = await prisma.reward.update({
        where: { id: existing.id },
        data: rew,
      });
      createdRewards.push(updated);
    } else {
      const created = await prisma.reward.create({
        data: rew,
      });
      createdRewards.push(created);
    }
  }
  console.log(`Premi DEMO salvati nel catalogo: ${createdRewards.length}`);

  // 3. Utenti DEMO per verifica ciclo LP e saldi
  // - Utente 1: Saldo basso (es. 25 LP) - non può permettersi nessun premio o solo wallpaper
  // - Utente 2: Saldo medio (es. 250 LP) - sufficiente per premio economico (100 LP) ma non per medio/alto
  // - Utente 3: Saldo alto (es. 3.500 LP) - abbastanza per felpa (2.000 LP) o qualsiasi altro premio
  const demoUsers = [
    {
      email: "demo-low-lp@leonessa.test",
      name: "Luca",
      surname: "SaldoBasso",
      targetBalance: 25,
    },
    {
      email: "demo-medium-lp@leonessa.test",
      name: "Giulia",
      surname: "SaldoMedio",
      targetBalance: 250,
    },
    {
      email: "demo-high-lp@leonessa.test",
      name: "Matteo",
      surname: "SaldoAlto",
      targetBalance: 3500,
    },
  ];

  const userRecords = [];
  for (const du of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: du.email },
      update: {
        name: du.name,
        surname: du.surname,
        emailVerified: new Date(),
        deletedAt: null,
      },
      create: {
        email: du.email,
        name: du.name,
        surname: du.surname,
        emailVerified: new Date(),
      },
    });
    userRecords.push({ ...user, targetBalance: du.targetBalance });
  }

  // 4. PointTransactions positive da fonti diverse e transazione negativa di riscatto
  const lowUser = userRecords.find((u) => u.email === "demo-low-lp@leonessa.test");
  const medUser = userRecords.find((u) => u.email === "demo-medium-lp@leonessa.test");
  const highUser = userRecords.find((u) => u.email === "demo-high-lp@leonessa.test");

  // Reset demo point transactions and balances for idempotency
  await prisma.pointTransaction.deleteMany({
    where: {
      userId: { in: userRecords.map((u) => u.id) },
    },
  });
  await prisma.rewardRedemption.deleteMany({
    where: {
      userId: { in: userRecords.map((u) => u.id) },
    },
  });

  // Utente Basso: 1 check-in (25 LP)
  if (lowUser) {
    await prisma.pointTransaction.create({
      data: {
        userId: lowUser.id,
        amount: 25,
        type: "LP",
        sourceType: "EVENT",
        reason: "[DEMO] Check-in presenza partita",
        idempotencyKey: `demo-tx-low-1-${lowUser.id}`,
      },
    });
    await prisma.userLPBalance.upsert({
      where: { userId: lowUser.id },
      create: { userId: lowUser.id, balance: 25, lifetimeEarned: 25 },
      update: { balance: 25, lifetimeEarned: 25 },
    });
  }

  // Utente Medio: Referral (+100) + Check-in (+50) + Missioni (+100) = 250 LP
  if (medUser) {
    await prisma.pointTransaction.createMany({
      data: [
        {
          userId: medUser.id,
          amount: 100,
          type: "LP",
          sourceType: "REFERRAL",
          reason: "[DEMO] Invito amico completato",
          idempotencyKey: `demo-tx-med-1-${medUser.id}`,
        },
        {
          userId: medUser.id,
          amount: 50,
          type: "LP",
          sourceType: "EVENT",
          reason: "[DEMO] Presenza evento speciale",
          idempotencyKey: `demo-tx-med-2-${medUser.id}`,
        },
        {
          userId: medUser.id,
          amount: 100,
          type: "LP",
          sourceType: "MISSION",
          reason: "[DEMO] Completamento missioni della settimana",
          idempotencyKey: `demo-tx-med-3-${medUser.id}`,
        },
      ],
    });
    await prisma.userLPBalance.upsert({
      where: { userId: medUser.id },
      create: { userId: medUser.id, balance: 250, lifetimeEarned: 250 },
      update: { balance: 250, lifetimeEarned: 250 },
    });
  }

  // Utente Alto: Ha guadagnato 3.600 LP (Fanta + Missioni + Referral + Eventi)
  // E ha già riscattato 1 premio economico (-100 LP), saldo attuale = 3.500 LP
  if (highUser) {
    const ecoReward = createdRewards.find((r) => r.name.includes("Sconto 10%"));

    await prisma.pointTransaction.createMany({
      data: [
        {
          userId: highUser.id,
          amount: 2000,
          type: "LP",
          sourceType: "MISSION",
          reason: "[DEMO] Fanta Leonessa - Campione di giornata",
          idempotencyKey: `demo-tx-high-1-${highUser.id}`,
        },
        {
          userId: highUser.id,
          amount: 1000,
          type: "LP",
          sourceType: "STREAK",
          reason: "[DEMO] Streak 30 giorni consecutivi",
          idempotencyKey: `demo-tx-high-2-${highUser.id}`,
        },
        {
          userId: highUser.id,
          amount: 600,
          type: "LP",
          sourceType: "REFERRAL",
          reason: "[DEMO] Referral multipli",
          idempotencyKey: `demo-tx-high-3-${highUser.id}`,
        },
      ],
    });

    if (ecoReward) {
      // Transazione negativa di riscatto
      await prisma.pointTransaction.create({
        data: {
          userId: highUser.id,
          amount: -100,
          type: "LP",
          sourceType: "REWARD_REDEMPTION",
          sourceId: ecoReward.id,
          reason: `[DEMO] Riscatto premio: ${ecoReward.name}`,
          idempotencyKey: `demo-tx-high-redemption-${highUser.id}`,
        },
      });

      // Riscatto nello storico con claim code (COMPLETED)
      await prisma.rewardRedemption.create({
        data: {
          userId: highUser.id,
          rewardId: ecoReward.id,
          costLp: 100,
          status: "COMPLETED",
          code: "LEO-DEMO-BAR1",
          idempotencyKey: `demo-redemption-completed-${highUser.id}`,
          metadata: {
            rewardName: ecoReward.name,
            demo: true,
          },
        },
      });
    }

    // Creiamo anche una seconda redemption in stato PENDING per verificare la differenziazione degli stati nel Control Center
    const saccaReward = createdRewards.find((r) => r.name.includes("Sacca Sportiva"));
    if (saccaReward) {
      await prisma.rewardRedemption.create({
        data: {
          userId: highUser.id,
          rewardId: saccaReward.id,
          costLp: 500,
          status: "PENDING",
          code: "LEO-DEMO-SAC2",
          idempotencyKey: `demo-redemption-pending-${highUser.id}`,
          metadata: {
            rewardName: saccaReward.name,
            demo: true,
          },
        },
      });
    }

    await prisma.userLPBalance.upsert({
      where: { userId: highUser.id },
      create: { userId: highUser.id, balance: 3500, lifetimeEarned: 3600 },
      update: { balance: 3500, lifetimeEarned: 3600 },
    });
  }

  console.log("Seed DEMO Economy & Rewards completato con successo!");
}

main()
  .catch((e) => {
    console.error("Errore durante seed demo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
