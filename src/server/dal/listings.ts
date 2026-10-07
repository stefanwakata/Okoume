import "server-only";
import { and, desc, eq, ilike, inArray, or, sql, count } from "drizzle-orm";
import { db } from "@/server/db";
import { listing, user } from "@/server/db/schema";
import { requireMember, getViewer, isMember, requireUser } from "@/server/dal/session";
import { AppError, notFound } from "@/server/errors";
import type { ListingInput } from "@/lib/validation";
import type { SectionId } from "@/lib/sections";
import { cancelOpenRequestsFor } from "@/server/dal/reservations";

export const MAX_ACTIVE_LISTINGS = 20;

// Public DTO: what any visitor may see.
const publicCols = {
  id: listing.id,
  section: listing.section,
  courseCode: listing.courseCode,
  title: listing.title,
  edition: listing.edition,
  school: listing.school,
  condition: listing.condition,
  kind: listing.kind,
  priceCents: listing.priceCents,
  spineColor: listing.spineColor,
  status: listing.status,
  createdAt: listing.createdAt,
};
export type PublicListing = {
  id: string; section: SectionId; courseCode: string; title: string; edition: string; school: string;
  condition: string; kind: "sale" | "loan"; priceCents: number | null; spineColor: string;
  status: "available" | "reserved" | "lent" | "closed" | "removed"; createdAt: Date;
};

export async function listShelf(): Promise<PublicListing[]> {
  return db.select(publicCols).from(listing)
    .where(inArray(listing.status, ["available", "reserved", "lent"]))
    .orderBy(listing.section, listing.courseCode).limit(300);
}

export async function searchListings(opts: { q?: string; section?: SectionId; page?: number }) {
  const page = Math.max(1, opts.page ?? 1), size = 24;
  const conds = [inArray(listing.status, ["available", "reserved", "lent"])];
  if (opts.section) conds.push(eq(listing.section, opts.section));
  if (opts.q) {
    const q = `%${opts.q.replace(/[%_\\]/g, (c) => "\\" + c).slice(0, 60)}%`;
    conds.push(or(ilike(listing.courseCode, q), ilike(listing.title, q))!);
  }
  const where = and(...conds);
  const [rows, [{ n }]] = await Promise.all([
    db.select(publicCols).from(listing).where(where).orderBy(desc(listing.createdAt)).limit(size).offset((page - 1) * size),
    db.select({ n: count() }).from(listing).where(where),
  ]);
  return { rows: rows as PublicListing[], total: n, page, pages: Math.max(1, Math.ceil(n / size)) };
}

/** Detail: members also see seller first name and meeting place; owners see everything about their listing. */
export async function getListing(id: string) {
  const viewer = await getViewer();
  const [row] = await db.select({ ...publicCols, sellerId: listing.sellerId, meetingPlace: listing.meetingPlace, sellerName: user.name })
    .from(listing).innerJoin(user, eq(user.id, listing.sellerId)).where(eq(listing.id, id)).limit(1);
  if (!row || row.status === "removed") throw notFound();
  const isOwner = viewer?.id === row.sellerId;
  if (row.status === "closed" && !isOwner && viewer?.role !== "admin") throw notFound();
  const canSeeContact = isMember(viewer) || isOwner;
  // Explicit DTO: never spread the row (it holds the seller's id and full name).
  const { sellerId: _sid, sellerName: _sn, meetingPlace: _mp, ...pub } = row;
  return {
    ...(pub as PublicListing),
    isOwner,
    sellerFirstName: canSeeContact ? row.sellerName.split(" ")[0] : null,
    meetingPlace: canSeeContact ? row.meetingPlace : null,
  };
}

export async function createListing(input: ListingInput) {
  const me = await requireMember();
  return db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: count() }).from(listing)
      .where(and(eq(listing.sellerId, me.id), inArray(listing.status, ["available", "reserved", "lent"])));
    if (n >= MAX_ACTIVE_LISTINGS) throw new AppError("limit", `Tu as déjà ${MAX_ACTIVE_LISTINGS} annonces actives. Retire-en une avant d’en publier une autre.`);
    const [row] = await tx.insert(listing).values({ ...input, sellerId: me.id }).returning({ id: listing.id });
    return row;
  });
}

export async function updateListing(id: string, input: ListingInput) {
  const me = await requireMember();
  const [row] = await db.update(listing).set(input)
    .where(and(eq(listing.id, id), eq(listing.sellerId, me.id), eq(listing.status, "available")))
    .returning({ id: listing.id });
  if (!row) throw new AppError("conflict", "Cette annonce ne peut plus être modifiée (réservée, prêtée ou retirée).");
  return row;
}

export async function withdrawListing(id: string) {
  const me = await requireMember();
  const [row] = await db.update(listing).set({ status: "removed" })
    .where(and(eq(listing.id, id), eq(listing.sellerId, me.id), eq(listing.status, "available")))
    .returning({ id: listing.id });
  if (!row) throw new AppError("conflict", "Tu ne peux retirer qu’une annonce disponible. Réponds d’abord à la réservation en cours.");
  await cancelOpenRequestsFor([row.id]);
  return row;
}

export async function myListings() {
  const me = await requireUser();
  return db.select({ ...publicCols, meetingPlace: listing.meetingPlace }).from(listing)
    .where(and(eq(listing.sellerId, me.id), sql`${listing.status} <> 'removed'`))
    .orderBy(desc(listing.createdAt));
}

export async function getOwnListingForEdit(id: string) {
  const me = await requireMember();
  const [row] = await db.select().from(listing).where(and(eq(listing.id, id), eq(listing.sellerId, me.id))).limit(1);
  if (!row || row.status === "removed") throw notFound();
  return row;
}
