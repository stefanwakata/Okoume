import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { listing, reservation, emailOutbox } from "@/server/db/schema";
import * as R from "@/server/dal/reservations";
import { as, makeUser, makeListing, makeReservation, settle } from "./factories";

const isoIn = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
const statusOf = async (id: string) => (await db.select().from(reservation).where(eq(reservation.id, id)))[0].status;
const listingStatus = async (id: string) => (await db.select().from(listing).where(eq(listing.id, id)))[0].status;

describe("demander", () => {
  it("membre : demande créée et courriel au vendeur", async () => {
    const seller = await makeUser(), buyer = await makeUser();
    const l = await makeListing(seller.id);
    as(buyer);
    const r = await R.requestReservation(l.id, "jeudi ?");
    await settle();
    expect(await statusOf(r.id)).toBe("requested");
    const mails = await db.select().from(emailOutbox).where(eq(emailOutbox.to, seller.email));
    expect(mails).toHaveLength(1);
    expect(mails[0].text).toContain("jeudi ?");
  });
  it("compte en attente : refusé", async () => {
    const l = await makeListing((await makeUser()).id);
    as(await makeUser({ status: "pending" }));
    await expect(R.requestReservation(l.id, null)).rejects.toMatchObject({ code: "forbidden" });
  });
  it("son propre livre : refusé", async () => {
    const me = await makeUser();
    const l = await makeListing(me.id);
    as(me);
    await expect(R.requestReservation(l.id, null)).rejects.toMatchObject({ code: "invalid" });
  });
  it("une seule demande active par livre, même en double clic", async () => {
    const l = await makeListing((await makeUser()).id);
    const a = await makeUser(), b = await makeUser();
    as(a);
    const results = await Promise.allSettled([R.requestReservation(l.id, null), R.requestReservation(l.id, null)]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    as(b);
    await expect(R.requestReservation(l.id, null)).rejects.toMatchObject({ code: "conflict" });
  });
  it(`limite de ${R.MAX_REQUESTS_PER_DAY} demandes par jour`, async () => {
    const seller = await makeUser(), buyer = await makeUser();
    for (let i = 0; i < R.MAX_REQUESTS_PER_DAY; i++) await makeReservation((await makeListing(seller.id)).id, buyer.id, "cancelled");
    const l = await makeListing(seller.id);
    as(buyer);
    await expect(R.requestReservation(l.id, null)).rejects.toMatchObject({ code: "limit" });
  });
  it("livre retiré : introuvable", async () => {
    const l = await makeListing((await makeUser()).id, { status: "removed" });
    as(await makeUser());
    await expect(R.requestReservation(l.id, null)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("répondre", () => {
  it("seul le vendeur accepte ; le livre passe à réservé ; l’acheteur reçoit le courriel du vendeur", async () => {
    const seller = await makeUser(), buyer = await makeUser(), other = await makeUser();
    const l = await makeListing(seller.id);
    const r = await makeReservation(l.id, buyer.id);
    as(other);
    await expect(R.acceptReservation(r.id)).rejects.toMatchObject({ code: "not_found" });
    as(buyer);
    await expect(R.acceptReservation(r.id)).rejects.toMatchObject({ code: "not_found" });
    as(seller);
    await R.acceptReservation(r.id);
    await settle();
    expect(await statusOf(r.id)).toBe("accepted");
    expect(await listingStatus(l.id)).toBe("reserved");
    const [mail] = await db.select().from(emailOutbox).where(eq(emailOutbox.to, buyer.email));
    expect(mail.text).toContain(seller.email);
  });
  it("accepter deux fois : conflit, rien ne change", async () => {
    const seller = await makeUser();
    const l = await makeListing(seller.id);
    const r = await makeReservation(l.id, (await makeUser()).id);
    as(seller);
    await R.acceptReservation(r.id);
    await expect(R.acceptReservation(r.id)).rejects.toMatchObject({ code: "conflict" });
  });
  it("accepter une demande sur un livre retiré entre-temps : conflit et rollback", async () => {
    const seller = await makeUser();
    const l = await makeListing(seller.id, { status: "removed" });
    const r = await makeReservation(l.id, (await makeUser()).id);
    as(seller);
    await expect(R.acceptReservation(r.id)).rejects.toMatchObject({ code: "conflict" });
    expect(await statusOf(r.id)).toBe("requested");
    expect(await listingStatus(l.id)).toBe("removed");
  });
  it("refuser : le livre reste disponible", async () => {
    const seller = await makeUser();
    const l = await makeListing(seller.id);
    const r = await makeReservation(l.id, (await makeUser()).id);
    as(seller);
    await R.declineReservation(r.id);
    expect(await statusOf(r.id)).toBe("declined");
    expect(await listingStatus(l.id)).toBe("available");
  });
  it("annuler : seulement l’acheteur, seulement avant acceptation", async () => {
    const seller = await makeUser(), buyer = await makeUser();
    const l = await makeListing(seller.id);
    const r = await makeReservation(l.id, buyer.id);
    as(seller);
    await expect(R.cancelReservation(r.id)).rejects.toMatchObject({ code: "conflict" });
    as(buyer);
    await R.cancelReservation(r.id);
    expect(await statusOf(r.id)).toBe("cancelled");
    const r2 = await makeReservation(l.id, buyer.id, "accepted");
    await expect(R.cancelReservation(r2.id)).rejects.toMatchObject({ code: "conflict" });
  });
});

describe("remise", () => {
  it("vente : réservation terminée, annonce vendue", async () => {
    const seller = await makeUser();
    const l = await makeListing(seller.id, { status: "reserved" });
    const r = await makeReservation(l.id, (await makeUser()).id, "accepted");
    as(seller);
    await R.markHandedOver(r.id);
    expect(await statusOf(r.id)).toBe("completed");
    expect(await listingStatus(l.id)).toBe("closed");
  });
  it("prêt : date de retour obligatoire et dans les 6 mois", async () => {
    const seller = await makeUser();
    const l = await makeListing(seller.id, { kind: "loan", priceCents: null, status: "reserved" });
    const r = await makeReservation(l.id, (await makeUser()).id, "accepted");
    as(seller);
    await expect(R.markHandedOver(r.id)).rejects.toMatchObject({ code: "invalid" });
    await expect(R.markHandedOver(r.id, isoIn(-1))).rejects.toMatchObject({ code: "invalid" });
    await expect(R.markHandedOver(r.id, isoIn(400))).rejects.toMatchObject({ code: "invalid" });
    await R.markHandedOver(r.id, isoIn(60));
    expect(await statusOf(r.id)).toBe("handed");
    expect(await listingStatus(l.id)).toBe("lent");
  });
  it("retour d’un prêt : le livre revient sur l’étagère ; une vente ne « revient » pas", async () => {
    const seller = await makeUser();
    const loan = await makeListing(seller.id, { kind: "loan", priceCents: null, status: "lent" });
    const r = await makeReservation(loan.id, (await makeUser()).id, "handed", { dueDate: isoIn(10) });
    const sale = await makeListing(seller.id, { status: "reserved" });
    const r2 = await makeReservation(sale.id, (await makeUser()).id, "accepted");
    as(seller);
    await R.markReturned(r.id);
    expect(await statusOf(r.id)).toBe("returned");
    expect(await listingStatus(loan.id)).toBe("available");
    await expect(R.markReturned(r2.id)).rejects.toMatchObject({ code: "invalid" });
  });
  it("après un retour, quelqu’un d’autre peut réserver le même livre", async () => {
    const seller = await makeUser();
    const l = await makeListing(seller.id, { kind: "loan", priceCents: null, status: "lent" });
    const r = await makeReservation(l.id, (await makeUser()).id, "handed", { dueDate: isoIn(10) });
    as(seller);
    await R.markReturned(r.id);
    as(await makeUser());
    await expect(R.requestReservation(l.id, null)).resolves.toHaveProperty("id");
  });
});
