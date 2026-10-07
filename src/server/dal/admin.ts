import "server-only";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/server/db";
import { auditLog, listing, reservation, session, user } from "@/server/db/schema";
import { requireAdmin } from "@/server/dal/session";
import { audit } from "@/server/dal/audit";
import { AppError, notFound } from "@/server/errors";
import { queueEmail } from "@/server/email";
import { appUrl } from "@/lib/env";
import { cancelOpenRequestsFor } from "@/server/dal/reservations";

export async function listMembers(status: "pending" | "approved" | "suspended") {
  await requireAdmin();
  return db.select({ id: user.id, name: user.name, email: user.email, school: user.school, emailVerified: user.emailVerified, createdAt: user.createdAt, role: user.role })
    .from(user).where(eq(user.memberStatus, status)).orderBy(desc(user.createdAt)).limit(200);
}

export async function setMemberStatus(userId: string, status: "approved" | "suspended") {
  const me = await requireAdmin();
  if (userId === me.id) throw new AppError("invalid", "Tu ne peux pas changer ton propre statut.");
  const [u] = await db.update(user).set({ memberStatus: status }).where(and(eq(user.id, userId), ne(user.role, "admin")))
    .returning({ id: user.id, email: user.email, name: user.name, verified: user.emailVerified });
  if (!u) throw notFound();
  if (status === "suspended") {
    await db.delete(session).where(eq(session.userId, userId)); // kill every active session (ASVS 7.4.2)
    const removed = await db.update(listing).set({ status: "removed" })
      .where(and(eq(listing.sellerId, userId), inArray(listing.status, ["available", "reserved"]))).returning({ id: listing.id });
    await cancelOpenRequestsFor(removed.map((l) => l.id));
    // Their own pending requests on other people's books are withdrawn too.
    await db.update(reservation).set({ status: "cancelled", decidedAt: new Date() })
      .where(and(eq(reservation.buyerId, userId), eq(reservation.status, "requested")));
  }
  await audit(me.id, `member.${status}`, "user", userId);
  if (status === "approved") {
    queueEmail({
      to: u.email, userId: u.id, kind: "member.approved",
      subject: "Ton compte Okoumé est validé",
      text: `Bonjour ${u.name.split(" ")[0]},\n\nLe comité de l’asso a validé ton compte. Tu peux maintenant publier tes livres et réserver ceux des autres :\n${appUrl}/annonces\n\nOkoumé`,
    });
  }
}

export async function adminRemoveListing(listingId: string, reason: string) {
  const me = await requireAdmin();
  const [l] = await db.update(listing).set({ status: "removed" }).where(eq(listing.id, listingId)).returning({ id: listing.id });
  if (!l) throw notFound();
  await cancelOpenRequestsFor([l.id]);
  await audit(me.id, "listing.removed", "listing", listingId, { reason });
}

export async function recentAudit() {
  await requireAdmin();
  const target = alias(user, "target_user");
  const tl = alias(listing, "target_listing");
  return db.select({
    id: auditLog.id, action: auditLog.action, targetType: auditLog.targetType, targetId: auditLog.targetId, details: auditLog.details,
    createdAt: auditLog.createdAt, actorName: user.name, targetName: target.name, listingLabel: sql<string | null>`${tl.courseCode} || ' ' || ${tl.title}`,
  }).from(auditLog)
    .leftJoin(user, eq(user.id, auditLog.actorId))
    .leftJoin(target, and(eq(auditLog.targetType, "user"), eq(sql`${target.id}::text`, auditLog.targetId)))
    .leftJoin(tl, and(eq(auditLog.targetType, "listing"), eq(sql`${tl.id}::text`, auditLog.targetId)))
    .orderBy(desc(auditLog.createdAt)).limit(50);
}

export async function adminCounts() {
  await requireAdmin();
  const [r] = await db.execute<{ pending: number; members: number; listings: number }>(sql`
    select (select count(*) from "user" where member_status = 'pending' and email_verified)::int as pending,
           (select count(*) from "user" where member_status = 'approved')::int as members,
           (select count(*) from listing where status in ('available','reserved','lent'))::int as listings`).then((x) => x.rows);
  return r;
}
