import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { listing, reservation, user, session } from "@/server/db/schema";
import { requireUser } from "@/server/dal/session";

/** Everything Okoumé keeps about the viewer, in a portable format (Loi 25, art. 27: right to data portability). */
export async function exportMyData() {
  const me = await requireUser();
  const [profile] = await db.select({ name: user.name, email: user.email, school: user.school, memberStatus: user.memberStatus, emailVerified: user.emailVerified, createdAt: user.createdAt })
    .from(user).where(eq(user.id, me.id));
  const listings = await db.select({ id: listing.id, courseCode: listing.courseCode, title: listing.title, edition: listing.edition, condition: listing.condition, school: listing.school, kind: listing.kind, priceCents: listing.priceCents, meetingPlace: listing.meetingPlace, status: listing.status, createdAt: listing.createdAt })
    .from(listing).where(eq(listing.sellerId, me.id)).orderBy(desc(listing.createdAt));
  const reservations = await db.select({ id: reservation.id, listingId: reservation.listingId, status: reservation.status, message: reservation.message, dueDate: reservation.dueDate, createdAt: reservation.createdAt })
    .from(reservation).where(eq(reservation.buyerId, me.id)).orderBy(desc(reservation.createdAt));
  const sessions = await db.select({ createdAt: session.createdAt, expiresAt: session.expiresAt, userAgent: session.userAgent })
    .from(session).where(eq(session.userId, me.id));
  return { exportedAt: new Date().toISOString(), profile, listings, reservations, sessions };
}

export async function accountSummary() {
  const me = await requireUser();
  const [u] = await db.select({ school: user.school, createdAt: user.createdAt }).from(user).where(eq(user.id, me.id));
  return { ...me, school: u?.school ?? null, createdAt: u?.createdAt ?? null };
}
