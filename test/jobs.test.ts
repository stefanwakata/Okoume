import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { emailOutbox, reservation, user } from "@/server/db/schema";
import { runDaily } from "@/server/jobs";
import { makeUser, makeListing, makeReservation } from "./factories";

const isoIn = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

describe("tâche quotidienne", () => {
  it("rappel de retour une seule fois, 3 jours avant", async () => {
    const seller = await makeUser(), soon = await makeUser(), later = await makeUser();
    const r1 = await makeReservation((await makeListing(seller.id, { kind: "loan", priceCents: null, status: "lent" })).id, soon.id, "handed", { dueDate: isoIn(2) });
    await makeReservation((await makeListing(seller.id, { kind: "loan", priceCents: null, status: "lent" })).id, later.id, "handed", { dueDate: isoIn(20) });
    expect((await runDaily()).reminders).toBe(1);
    expect((await runDaily()).reminders).toBe(0);
    const mails = await db.select().from(emailOutbox).where(eq(emailOutbox.to, soon.email));
    expect(mails).toHaveLength(1);
    expect(mails[0].subject).not.toMatch(/\d{4}-\d{2}-\d{2}/); // human date, not ISO
    expect((await db.select().from(reservation).where(eq(reservation.id, r1.id)))[0].remindedAt).not.toBeNull();
  });
  it("efface les inscriptions jamais confirmées après 7 jours", async () => {
    const old = await makeUser({ verified: false, createdAt: new Date(Date.now() - 8 * 864e5) });
    const fresh = await makeUser({ verified: false });
    const r = await runDaily();
    expect(r.unverifiedUsers).toBe(1);
    expect(await db.select().from(user).where(eq(user.id, old.id))).toHaveLength(0);
    expect(await db.select().from(user).where(eq(user.id, fresh.id))).toHaveLength(1);
  });
});
