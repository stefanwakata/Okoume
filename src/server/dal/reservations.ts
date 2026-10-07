import "server-only";
import { and, desc, eq, gte, inArray, sql, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/server/db";
import { listing, reservation, user } from "@/server/db/schema";
import { requireMember, requireUser } from "@/server/dal/session";
import { AppError, notFound } from "@/server/errors";
import { queueEmail } from "@/server/email";
import { appUrl } from "@/lib/env";
import { priceLabel } from "@/lib/sections";

export const MAX_REQUESTS_PER_DAY = 10;
const ACTIVE = ["requested", "accepted", "handed"] as const;

const fmtDate = (d: string) => new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));

export async function requestReservation(listingId: string, message: string | null) {
  const me = await requireMember();
  const [l] = await db.select({ id: listing.id, sellerId: listing.sellerId, status: listing.status, title: listing.title, courseCode: listing.courseCode, kind: listing.kind, priceCents: listing.priceCents })
    .from(listing).where(eq(listing.id, listingId)).limit(1);
  if (!l || l.status === "removed" || l.status === "closed") throw notFound();
  if (l.sellerId === me.id) throw new AppError("invalid", "C’est ton annonce : tu ne peux pas la réserver.");
  if (l.status !== "available") throw new AppError("conflict", "Quelqu’un a déjà réservé ce livre. Il reviendra sur l’étagère si la réservation est annulée.");

  const [{ n }] = await db.select({ n: count() }).from(reservation)
    .where(and(eq(reservation.buyerId, me.id), gte(reservation.createdAt, sql`now() - interval '24 hours'`)));
  if (n >= MAX_REQUESTS_PER_DAY) throw new AppError("limit", `Tu as fait ${MAX_REQUESTS_PER_DAY} demandes aujourd’hui. Réessaie demain.`);

  let row: { id: string };
  try {
    [row] = await db.insert(reservation).values({ listingId, buyerId: me.id, message }).returning({ id: reservation.id });
  } catch (e) {
    // reservation_one_active_uq: someone (or a double click) got there first
    if (String((e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code) === "23505")
      throw new AppError("conflict", "Quelqu’un a déjà réservé ce livre.");
    throw e;
  }
  const [seller] = await db.select({ email: user.email, name: user.name, id: user.id }).from(user).where(eq(user.id, l.sellerId));
  queueEmail({
    to: seller.email, userId: seller.id, kind: "reservation.requested",
    subject: `${me.name.split(" ")[0]} veut réserver ${l.courseCode}`,
    text: `Bonjour ${seller.name.split(" ")[0]},\n\n${me.name.split(" ")[0]} veut ${l.kind === "loan" ? "emprunter" : "acheter"} ton livre « ${l.title} » (${l.courseCode}, ${priceLabel(l.kind, l.priceCents)}).${message ? `\n\nSon message : « ${message} »` : ""}\n\nAccepte ou refuse la demande ici :\n${appUrl}/compte/reservations\n\nOkoumé`,
  });
  return row;
}

async function loadForSeller(reservationId: string, sellerId: string) {
  const [r] = await db.select({
    id: reservation.id, status: reservation.status, buyerId: reservation.buyerId, listingId: reservation.listingId,
    kind: listing.kind, title: listing.title, courseCode: listing.courseCode, meetingPlace: listing.meetingPlace,
  }).from(reservation).innerJoin(listing, eq(listing.id, reservation.listingId))
    .where(and(eq(reservation.id, reservationId), eq(listing.sellerId, sellerId))).limit(1);
  if (!r) throw notFound();
  const [buyer] = await db.select({ email: user.email, name: user.name, id: user.id }).from(user).where(eq(user.id, r.buyerId));
  return { r, buyer };
}

function wrongState(): never {
  throw new AppError("conflict", "Cette réservation a déjà changé d’état. Recharge la page.");
}

export async function acceptReservation(id: string) {
  const me = await requireMember();
  const { r, buyer } = await loadForSeller(id, me.id);
  await db.transaction(async (tx) => {
    const [u] = await tx.update(reservation).set({ status: "accepted", decidedAt: new Date() })
      .where(and(eq(reservation.id, id), eq(reservation.status, "requested"))).returning({ id: reservation.id });
    if (!u) wrongState();
    const [l] = await tx.update(listing).set({ status: "reserved" })
      .where(and(eq(listing.id, r.listingId), eq(listing.status, "available"))).returning({ id: listing.id });
    if (!l) throw new AppError("conflict", "Ce livre n’est plus disponible (retiré ou déjà réservé)."); // rolls back the transaction
  });
  queueEmail({
    to: buyer.email, userId: buyer.id, kind: "reservation.accepted",
    subject: `C’est d’accord pour ${r.courseCode}`,
    text: `Bonjour ${buyer.name.split(" ")[0]},\n\n${me.name.split(" ")[0]} a accepté ta demande pour « ${r.title} ».\nLieu proposé : ${r.meetingPlace}.\n\nÉcris-lui à ${me.email} pour fixer le jour et l’heure.\n\nOkoumé`,
  });
}

export async function declineReservation(id: string) {
  const me = await requireMember();
  const { r, buyer } = await loadForSeller(id, me.id);
  const [u] = await db.update(reservation).set({ status: "declined", decidedAt: new Date() })
    .where(and(eq(reservation.id, id), eq(reservation.status, "requested"))).returning({ id: reservation.id });
  if (!u) wrongState();
  queueEmail({
    to: buyer.email, userId: buyer.id, kind: "reservation.declined",
    subject: `Demande refusée pour ${r.courseCode}`,
    text: `Bonjour ${buyer.name.split(" ")[0]},\n\nLa personne qui propose « ${r.title} » ne peut pas donner suite à ta demande. D’autres exemplaires sont peut-être sur l’étagère :\n${appUrl}/annonces?q=${encodeURIComponent(r.courseCode)}\n\nOkoumé`,
  });
}

/** Cancels open requests on listings that leave the shelf (withdrawn, removed, owner suspended). */
export async function cancelOpenRequestsFor(listingIds: string[], exec: Pick<typeof db, "update"> = db) {
  if (!listingIds.length) return;
  await exec.update(reservation).set({ status: "cancelled", decidedAt: new Date() })
    .where(and(inArray(reservation.listingId, listingIds), inArray(reservation.status, ["requested", "accepted"])));
}

export async function cancelReservation(id: string) {
  const me = await requireUser();
  const [u] = await db.update(reservation).set({ status: "cancelled", decidedAt: new Date() })
    .where(and(eq(reservation.id, id), eq(reservation.buyerId, me.id), eq(reservation.status, "requested")))
    .returning({ id: reservation.id });
  if (!u) throw new AppError("conflict", "Tu ne peux annuler qu’une demande pas encore acceptée.");
}

/** Seller confirms the book changed hands. Sale: listing closed. Loan: lent until dueDate. */
export async function markHandedOver(id: string, dueDate?: string) {
  const me = await requireMember();
  const { r, buyer } = await loadForSeller(id, me.id);
  if (r.kind === "loan") {
    if (!dueDate) throw new AppError("invalid", "Choisis la date de retour du prêt.");
    const d = new Date(dueDate + "T12:00:00Z").getTime(), now = Date.now();
    if (!(d > now) || d - now > 1000 * 60 * 60 * 24 * 200) throw new AppError("invalid", "La date de retour doit être dans les 6 prochains mois.");
  }
  await db.transaction(async (tx) => {
    const [u] = await tx.update(reservation)
      .set(r.kind === "loan" ? { status: "handed", dueDate: dueDate! } : { status: "completed" })
      .where(and(eq(reservation.id, id), eq(reservation.status, "accepted"))).returning({ id: reservation.id });
    if (!u) wrongState();
    await tx.update(listing).set({ status: r.kind === "loan" ? "lent" : "closed" }).where(eq(listing.id, r.listingId));
  });
  if (r.kind === "loan") {
    queueEmail({
      to: buyer.email, userId: buyer.id, kind: "loan.started",
      subject: `Prêt de ${r.courseCode} : retour le ${fmtDate(dueDate!)}`,
      text: `Bonjour ${buyer.name.split(" ")[0]},\n\nTu as maintenant « ${r.title} » en prêt. Date de retour : ${fmtDate(dueDate!)}.\nOn t’enverra un rappel 3 jours avant.\n\nOkoumé`,
    });
  }
}

export async function markReturned(id: string) {
  const me = await requireMember();
  const { r } = await loadForSeller(id, me.id);
  if (r.kind !== "loan") throw new AppError("invalid", "Seuls les prêts se rendent.");
  await db.transaction(async (tx) => {
    const [u] = await tx.update(reservation).set({ status: "returned" })
      .where(and(eq(reservation.id, id), eq(reservation.status, "handed"))).returning({ id: reservation.id });
    if (!u) wrongState();
    // Back on the shelf, unless the committee removed the listing in the meantime.
    await tx.update(listing).set({ status: "available" }).where(and(eq(listing.id, r.listingId), eq(listing.status, "lent")));
  });
}

const seller = alias(user, "seller");
const buyerU = alias(user, "buyer_user");

export async function myRequests() {
  const me = await requireUser();
  return db.select({
    id: reservation.id, status: reservation.status, dueDate: reservation.dueDate, createdAt: reservation.createdAt, message: reservation.message,
    listingId: listing.id, title: listing.title, courseCode: listing.courseCode, kind: listing.kind, priceCents: listing.priceCents,
    meetingPlace: listing.meetingPlace, sellerName: seller.name, sellerEmail: seller.email,
  }).from(reservation).innerJoin(listing, eq(listing.id, reservation.listingId)).innerJoin(seller, eq(seller.id, listing.sellerId))
    .where(eq(reservation.buyerId, me.id)).orderBy(desc(reservation.createdAt)).limit(100);
}

export async function incomingRequests() {
  const me = await requireUser();
  return db.select({
    id: reservation.id, status: reservation.status, dueDate: reservation.dueDate, createdAt: reservation.createdAt, message: reservation.message,
    listingId: listing.id, title: listing.title, courseCode: listing.courseCode, kind: listing.kind, priceCents: listing.priceCents,
    buyerName: buyerU.name, buyerEmail: buyerU.email,
  }).from(reservation).innerJoin(listing, eq(listing.id, reservation.listingId)).innerJoin(buyerU, eq(buyerU.id, reservation.buyerId))
    .where(and(eq(listing.sellerId, me.id), inArray(reservation.status, [...ACTIVE, "declined", "cancelled", "returned", "completed"])))
    .orderBy(desc(reservation.createdAt)).limit(100);
}

/** The viewer's active reservation on a listing, if any (to show the right button). */
export async function myActiveReservationFor(listingId: string, viewerId: string) {
  const [r] = await db.select({ id: reservation.id, status: reservation.status }).from(reservation)
    .where(and(eq(reservation.listingId, listingId), eq(reservation.buyerId, viewerId), inArray(reservation.status, [...ACTIVE]))).limit(1);
  return r ?? null;
}
