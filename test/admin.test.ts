import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { auditLog, emailOutbox, listing, reservation, session, user } from "@/server/db/schema";
import { setMemberStatus, adminRemoveListing, listMembers } from "@/server/dal/admin";
import { demoOutbox } from "@/server/dal/outbox";
import { as, makeUser, makeListing, makeReservation, makeSession, settle } from "./factories";

describe("comité", () => {
  it("un membre n’a accès à rien", async () => {
    const target = await makeUser({ status: "pending" });
    as(await makeUser());
    await expect(listMembers("pending")).rejects.toMatchObject({ code: "forbidden" });
    await expect(setMemberStatus(target.id, "approved")).rejects.toMatchObject({ code: "forbidden" });
    await expect(adminRemoveListing((await makeListing(target.id)).id, "spam")).rejects.toMatchObject({ code: "forbidden" });
  });
  it("valider : statut, courriel, journal", async () => {
    const admin = await makeUser({ admin: true }), target = await makeUser({ status: "pending" });
    as(admin);
    await setMemberStatus(target.id, "approved");
    await settle();
    expect((await db.select().from(user).where(eq(user.id, target.id)))[0].memberStatus).toBe("approved");
    expect(await db.select().from(emailOutbox).where(eq(emailOutbox.to, target.email))).toHaveLength(1);
    const [log] = await db.select().from(auditLog);
    expect(log).toMatchObject({ actorId: admin.id, action: "member.approved", targetId: target.id });
  });
  it("suspendre : sessions fermées, annonces retirées, demandes annulées", async () => {
    const admin = await makeUser({ admin: true }), target = await makeUser(), other = await makeUser();
    await makeSession(target.id);
    const mine = await makeListing(target.id);
    const onMine = await makeReservation(mine.id, other.id);
    const theirs = await makeListing(other.id);
    const myRequest = await makeReservation(theirs.id, target.id);
    as(admin);
    await setMemberStatus(target.id, "suspended");
    expect(await db.select().from(session).where(eq(session.userId, target.id))).toHaveLength(0);
    expect((await db.select().from(listing).where(eq(listing.id, mine.id)))[0].status).toBe("removed");
    expect((await db.select().from(reservation).where(eq(reservation.id, onMine.id)))[0].status).toBe("cancelled");
    expect((await db.select().from(reservation).where(eq(reservation.id, myRequest.id)))[0].status).toBe("cancelled");
  });
  it("on ne change ni son propre statut ni celui d’un autre membre du comité", async () => {
    const admin = await makeUser({ admin: true }), admin2 = await makeUser({ admin: true });
    as(admin);
    await expect(setMemberStatus(admin.id, "suspended")).rejects.toMatchObject({ code: "invalid" });
    await expect(setMemberStatus(admin2.id, "suspended")).rejects.toMatchObject({ code: "not_found" });
  });
  it("retirer une annonce : journal avec la raison", async () => {
    const admin = await makeUser({ admin: true });
    const l = await makeListing((await makeUser()).id);
    as(admin);
    await adminRemoveListing(l.id, "Photocopie");
    const [log] = await db.select().from(auditLog);
    expect(log.details).toEqual({ reason: "Photocopie" });
  });
});

describe("boîte de démo", () => {
  it("disponible en mode démo seulement (DEMO_MODE=1 dans les tests)", async () => {
    await expect(demoOutbox()).resolves.toEqual([]);
  });
});
