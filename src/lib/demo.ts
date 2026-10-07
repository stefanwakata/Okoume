// Demo accounts created by scripts/seed.ts. Only shown when DEMO_MODE=1; never seeded in production.
export const DEMO_PASSWORD = "etagere-demo-2026-okoume";
export const DEMO_ACCOUNTS = [
  { email: "comite@demo.okoume.ca", name: "Comité (démo)", role: "Comité de l’asso : valide les comptes" },
  { email: "nadia@demo.okoume.ca", name: "Nadia (démo)", role: "Membre : a publié des livres" },
  { email: "samuel@demo.okoume.ca", name: "Samuel (démo)", role: "Membre : a réservé des livres" },
  { email: "lea@demo.okoume.ca", name: "Léa (démo)", role: "Compte en attente de validation" },
] as const;
