import type { RankingMock } from "../types/ranking";

type RankingMockInput = {
  userName: string;
  userInitials: string;
  schoolName: string;
  schoolShortName: string;
};

export function createRankingMock({
  userName,
  userInitials,
  schoolName,
  schoolShortName,
}: RankingMockInput): RankingMock {
  const currentUser = {
    id: "current-user",
    rank: 87,
    name: userName,
    school: schoolName,
    initials: userInitials,
    level: 4,
    lp: 1250,
    isCurrentUser: true,
  };

  const currentSchool = {
    id: "current-school",
    rank: 2,
    name: schoolName,
    shortName: schoolShortName,
    ssp: 11980,
    isCurrentSchool: true,
  };

  return {
    currentUser,
    currentSchool,
    userRanking: [
      {
        id: "marco-rossi",
        rank: 1,
        name: "Marco Rossi",
        school: "Copernico",
        initials: "MR",
        level: 10,
        lp: 9850,
      },
      {
        id: "giulia-bianchi",
        rank: 2,
        name: "Giulia Bianchi",
        school: "Lunardi",
        initials: "GB",
        level: 9,
        lp: 7420,
      },
      {
        id: "elena-serra",
        rank: 3,
        name: "Elena Serra",
        school: "Tartaglia",
        initials: "ES",
        level: 8,
        lp: 6240,
      },
      {
        id: "davide-ferrari",
        rank: 4,
        name: "Davide Ferrari",
        school: "Abba Ballini",
        initials: "DF",
        level: 7,
        lp: 4810,
      },
      {
        id: "sara-vitali",
        rank: 5,
        name: "Sara Vitali",
        school: "Castelli",
        initials: "SV",
        level: 6,
        lp: 3480,
      },
    ],
    schoolRanking: [
      {
        id: "copernico",
        rank: 1,
        name: "Copernico",
        shortName: "COP",
        ssp: 12450,
      },
      currentSchool,
      {
        id: "lunardi",
        rank: 3,
        name: "Lunardi",
        shortName: "LUN",
        ssp: 10750,
      },
      {
        id: "abba-ballini",
        rank: 4,
        name: "Abba Ballini",
        shortName: "ABB",
        ssp: 9460,
      },
      {
        id: "tartaglia",
        rank: 5,
        name: "Tartaglia",
        shortName: "TAR",
        ssp: 8920,
      },
    ],
    activeMissions: [
      {
        id: "profile-complete",
        title: "Completa il profilo",
        description: "Aggiungi le informazioni per farti riconoscere nella community.",
        rewardLP: 50,
        progress: 1,
        target: 1,
        status: "COMPLETED",
      },
      {
        id: "event-attendance",
        title: "Partecipa a un evento",
        description: "Vivi dal vivo un appuntamento della Leonessa Cup.",
        rewardLP: 100,
        progress: 0,
        target: 1,
        status: "AVAILABLE",
      },
      {
        id: "match-follow",
        title: "Segui una partita",
        description: "Resta connesso agli aggiornamenti della tua scuola.",
        rewardLP: 25,
        progress: 1,
        target: 3,
        status: "IN_PROGRESS",
      },
    ],
    completedMissions: [
      {
        id: "first-profile",
        title: "Profilo completo",
        description: "Profilo completato al 100%.",
        rewardLP: 50,
        progress: 1,
        target: 1,
        status: "CLAIMED",
        completedAt: "14 agosto",
      },
      {
        id: "first-match",
        title: "Prima partita seguita",
        description: "Hai seguito gli aggiornamenti del match.",
        rewardLP: 25,
        progress: 1,
        target: 1,
        status: "CLAIMED",
        completedAt: "12 agosto",
      },
    ],
    earnedBadges: [
      {
        id: "profile-complete",
        name: "Profilo completo",
        description: "Profilo completato al 100%.",
        rarity: "Comune",
        earnedAt: "14 agosto",
      },
      {
        id: "faithful-supporter",
        name: "Tifoso fedele",
        description: "Hai iniziato a sostenere la tua scuola.",
        rarity: "Raro",
        earnedAt: "12 agosto",
      },
    ],
    lockedBadges: [
      {
        id: "consistency",
        name: "Costanza",
        description: "Completa 10 missioni.",
        rarity: "Raro",
        progress: 6,
        target: 10,
      },
      {
        id: "unstoppable",
        name: "Inarrestabile",
        description: "Raggiungi una serie di 30 giorni.",
        rarity: "Epico",
        progress: 14,
        target: 30,
      },
    ],
    history: [
      { id: "profile", amount: 50, reason: "Profilo completato", date: "14 agosto" },
      { id: "referral", amount: 100, reason: "Amico invitato", date: "13 agosto" },
      { id: "school-win", amount: 100, reason: "Vittoria della scuola", date: "10 agosto" },
    ],
    stats: {
      lpEarned: 1250,
      missionsCompleted: 6,
      badgesEarned: 2,
      eventsAttended: 1,
      referralsCompleted: 1,
    },
  };
}
