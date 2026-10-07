import { describe, it, expect } from "vitest";
import { createListing, getListing, updateListing, withdrawListing, searchListings, MAX_ACTIVE_LISTINGS } from "@/server/dal/listings";
import { listingInput } from "@/lib/validation";
import { db } from "@/server/db";
import { listing, reservation } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { as, makeUser, makeListing, makeReservation } from "./factories";

const input = listingInput.parse({ section: "genie", courseCode: "IFT 1015", title: "Programmation 1", edition: "2e", school: "UQAM", condition: "Bon", kind: "sale", price: "30", meetingPlace: "Pavillon B", spineColor: "#7a2e2a" });

describe("publier", () => {
  it("visiteur : refusé", async () => {
    await expect(createListing(input)).rejects.toMatchObject({ code: "unauthorized" });
  });
  it("compte en attente : refusé", async () => {
    as(await makeUser({ status: "pending" }));
    await expect(createListing(input)).rejects.toMatchObject({ code: "forbidden" });
  });
  it("compte suspendu : refusé", async () => {
    as(await makeUser({ status: "suspended" }));
    await expect(createListing(input)).rejects.toMatchObject({ code: "forbidden" });
  });
  it("membre validé : publié, au nom du membre", async () => {
    const me = await makeUser();
    as(me);
    const { id } = await createListing(input);
    const [row] = await db.select().from(listing).where(eq(listing.id, id));
    expect(row.sellerId).toBe(me.id);
    expect(row.status).toBe("available");
  });
  it(`limite de ${MAX_ACTIVE_LISTINGS} annonces actives`, async () => {
    const me = await makeUser();
    for (let i = 0; i < MAX_ACTIVE_LISTINGS; i++) await makeListing(me.id);
    as(me);
    await expect(createListing(input)).rejects.toMatchObject({ code: "limit" });
  });
});

describe("modifier et retirer", () => {
  it("quelqu’un d’autre ne peut ni modifier ni retirer", async () => {
    const owner = await makeUser();
    const l = await makeListing(owner.id);
    as(await makeUser());
    await expect(updateListing(l.id, input)).rejects.toMatchObject({ code: "conflict" });
    await expect(withdrawListing(l.id)).rejects.toMatchObject({ code: "conflict" });
    const [row] = await db.select().from(listing).where(eq(listing.id, l.id));
    expect(row.title).toBe("Calcul");
  });
  it("une annonce réservée ne se modifie plus", async () => {
    const owner = await makeUser();
    const l = await makeListing(owner.id, { status: "reserved" });
    as(owner);
    await expect(updateListing(l.id, input)).rejects.toMatchObject({ code: "conflict" });
  });
  it("retirer annule les demandes en attente", async () => {
    const owner = await makeUser(), buyer = await makeUser();
    const l = await makeListing(owner.id);
    const r = await makeReservation(l.id, buyer.id);
    as(owner);
    await withdrawListing(l.id);
    const [res] = await db.select().from(reservation).where(eq(reservation.id, r.id));
    expect(res.status).toBe("cancelled");
  });
});

describe("voir une annonce", () => {
  it("visiteur et compte en attente : ni prénom ni lieu", async () => {
    const l = await makeListing((await makeUser({ name: "Nadia Roy" })).id);
    for (const viewer of [null, await makeUser({ status: "pending" })]) {
      as(viewer);
      const d = await getListing(l.id);
      expect(d.sellerFirstName).toBeNull();
      expect(d.meetingPlace).toBeNull();
      expect(JSON.stringify(d)).not.toContain("Roy");
      expect(d).not.toHaveProperty("sellerId");
    }
  });
  it("membre : prénom et lieu, jamais le nom de famille", async () => {
    const l = await makeListing((await makeUser({ name: "Nadia Roy" })).id);
    as(await makeUser());
    const d = await getListing(l.id);
    expect(d.sellerFirstName).toBe("Nadia");
    expect(d.meetingPlace).toBe("Pavillon A");
    expect(JSON.stringify(d)).not.toContain("Roy");
  });
  it("retirée : introuvable pour tous ; vendue : visible pour le vendeur seulement", async () => {
    const owner = await makeUser();
    const removed = await makeListing(owner.id, { status: "removed" });
    const closed = await makeListing(owner.id, { status: "closed" });
    as(owner);
    await expect(getListing(removed.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(getListing(closed.id)).resolves.toMatchObject({ isOwner: true });
    as(await makeUser());
    await expect(getListing(closed.id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("recherche", () => {
  it("cherche par code ou titre, ignore les annonces retirées, échappe % et _", async () => {
    const s = await makeUser();
    await makeListing(s.id, { courseCode: "PHY 1441", title: "Physique mécanique" });
    await makeListing(s.id, { courseCode: "PHY 2000", title: "Optique", status: "removed" });
    expect((await searchListings({ q: "phy" })).total).toBe(1);
    expect((await searchListings({ q: "mécanique" })).total).toBe(1);
    expect((await searchListings({ q: "%" })).total).toBe(0);
    expect((await searchListings({ section: "droit" })).total).toBe(0);
  });
});
