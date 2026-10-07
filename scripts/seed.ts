// Demo data: four demo accounts and the 13 books of the static demo. Refuses to run unless DEMO_MODE=1.
// Wipes the app tables first, so it can be re-run to reset the demo.
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import * as schema from "../src/server/db/schema";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/lib/demo";

if (process.env.DEMO_MODE !== "1") { console.error("Seed refusé : DEMO_MODE doit valoir 1 (jamais en production)."); process.exit(1); }
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle({ client: pool, schema });
const { user, account, listing, reservation, emailOutbox, auditLog } = schema;

const days = (n: number) => new Date(Date.now() + n * 864e5);
const isoDay = (n: number) => days(n).toISOString().slice(0, 10);

async function main() {
  await db.execute(sql`truncate table audit_log, email_outbox, reservation, listing, session, account, verification, rate_limit, "user" cascade`);

  const hash = await hashPassword(DEMO_PASSWORD);
  const people = [
    { ...DEMO_ACCOUNTS[0], role: "admin", memberStatus: "approved", school: "Université de Montréal" },
    { ...DEMO_ACCOUNTS[1], role: "user", memberStatus: "approved", school: "Université de Montréal" },
    { ...DEMO_ACCOUNTS[2], role: "user", memberStatus: "approved", school: "Polytechnique Montréal" },
    { ...DEMO_ACCOUNTS[3], role: "user", memberStatus: "pending", school: "UQAM" },
    { email: "karim@demo.okoume.ca", name: "Karim (démo)", role: "user", memberStatus: "approved", school: "HEC Montréal" },
    { email: "ines@demo.okoume.ca", name: "Inès (démo)", role: "user", memberStatus: "approved", school: "Concordia" },
  ] as const;
  const ids: Record<string, string> = {};
  for (const [i, p] of people.entries()) {
    const [u] = await db.insert(user).values({
      name: p.name, email: p.email, emailVerified: true, role: p.role, memberStatus: p.memberStatus, school: p.school,
      createdAt: days(-40 + i), updatedAt: days(-40 + i),
    }).returning({ id: user.id });
    ids[p.email.split("@")[0]] = u.id;
    await db.insert(account).values({ accountId: u.id, providerId: "credential", userId: u.id, password: hash, updatedAt: new Date() });
  }

  type Row = [section: "sciences" | "genie" | "gestion" | "droit", code: string, title: string, ed: string, school: string, cond: string, price: number | null, place: string, color: string, seller: string];
  const rows: Row[] = [
    ["sciences", "MAT 1400", "Calcul différentiel et intégral", "8e édition", "Université de Montréal", "Annoté", 45, "Pavillon Roger-Gaudry", "#7a2e2a", "nadia"],
    ["sciences", "PHY 1441", "Physique mécanique", "5e édition", "Université de Montréal", "Très bon", 40, "Campus MIL", "#2f4a5e", "nadia"],
    ["sciences", "CHM 1301", "Chimie générale", "4e édition", "Université de Montréal", "Abîmé", null, "Pavillon Roger-Gaudry", "#d1b45a", "nadia"],
    ["sciences", "BIO 1101", "Biologie cellulaire", "11e édition", "Université de Montréal", "Bon", null, "Campus MIL", "#3f6655", "nadia"],
    ["genie", "IFT 1015", "Programmation 1", "2e édition", "Université de Montréal", "Comme neuf", 30, "Pavillon André-Aisenstadt", "#b4543f", "samuel"],
    ["genie", "ING 1040", "Statique", "14e édition", "Polytechnique Montréal", "Annoté", 50, "Pavillon Lassonde", "#5a5f66", "samuel"],
    ["genie", "MATH 251", "Linear Algebra", "6th edition", "Concordia", "Bon", 30, "Hall Building", "#20384a", "ines"],
    ["gestion", "ECN 1000", "Principes d’économie", "4e édition", "Université de Montréal", "Bon", 30, "Pavillon Lionel-Groulx", "#8a6d3b", "karim"],
    ["gestion", "FIN 3500", "Gestion financière", "7e édition", "HEC Montréal", "Très bon", 55, "Édifice Côte-Sainte-Catherine", "#2d5446", "karim"],
    ["gestion", "ADM 1000", "Introduction au management", "3e édition", "UQAM", "Bon", null, "Pavillon des sciences de la gestion", "#6b3045", "karim"],
    ["droit", "DRT 1001", "Code civil du Québec 2026", "Édition annotée", "Université de Montréal", "Comme neuf", 25, "Faculté de droit", "#1f2c3a", "ines"],
    ["droit", "PSY 1004", "Psychologie", "8e édition", "Université de Montréal", "Bon", 35, "Pavillon Marie-Victorin", "#9a4a2f", "ines"],
    ["droit", "SOL 1001", "Introduction à la sociologie", "2e édition", "UQAM", "Annoté", null, "Pavillon Hubert-Aquin", "#4b5a3a", "nadia"],
  ];
  const L: Record<string, string> = {};
  for (const [i, r] of rows.entries()) {
    const [l] = await db.insert(listing).values({
      section: r[0], courseCode: r[1], title: r[2], edition: r[3], school: r[4], condition: r[5],
      kind: r[6] === null ? "loan" : "sale", priceCents: r[6] === null ? null : r[6] * 100,
      meetingPlace: r[7], spineColor: r[8], sellerId: ids[r[9]], createdAt: days(-30 + i), updatedAt: days(-30 + i),
    }).returning({ id: listing.id });
    L[r[1]] = l.id;
  }

  // A few reservations so every screen has something to show.
  await db.insert(reservation).values([
    { listingId: L["PHY 1441"], buyerId: ids.samuel, status: "requested", message: "Bonjour, je peux passer mardi midi au MIL si ça te va.", createdAt: days(-1) },
    { listingId: L["BIO 1101"], buyerId: ids.samuel, status: "handed", dueDate: isoDay(2), decidedAt: days(-20), createdAt: days(-21) },
    { listingId: L["FIN 3500"], buyerId: ids.nadia, status: "accepted", decidedAt: days(-2), createdAt: days(-3) },
    { listingId: L["ECN 1000"], buyerId: ids.samuel, status: "declined", decidedAt: days(-9), createdAt: days(-10) },
  ]);
  await db.update(listing).set({ status: "lent" }).where(sql`${listing.id} = ${L["BIO 1101"]}`);
  await db.update(listing).set({ status: "reserved" }).where(sql`${listing.id} = ${L["FIN 3500"]}`);

  await db.insert(auditLog).values([
    { actorId: ids.comite, action: "member.approved", targetType: "user", targetId: ids.samuel, createdAt: days(-35) },
    { actorId: ids.comite, action: "member.approved", targetType: "user", targetId: ids.nadia, createdAt: days(-36) },
  ]);
  await db.insert(emailOutbox).values({
    to: DEMO_ACCOUNTS[2].email, userId: ids.samuel, kind: "member.approved", status: "stored",
    subject: "Ton compte Okoumé est validé",
    text: "Bonjour Samuel,\n\nLe comité de l’asso a validé ton compte. Tu peux maintenant publier tes livres et réserver ceux des autres.\n\nOkoumé",
    createdAt: days(-35),
  });

  console.log(JSON.stringify({ evt: "db.seeded", users: people.length, listings: rows.length }));
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => pool.end());
