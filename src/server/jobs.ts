import "server-only";
import { and, eq, isNull, lte, lt, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { auditLog, emailOutbox, listing, rateLimit, reservation, session, user, verification } from "@/server/db/schema";
import { fmtDate } from "@/lib/present";
import { sendEmail } from "@/server/email";

/** Daily job: loan reminders 3 days before due date + housekeeping. Idempotent (remindedAt). */
export async function runDaily() {
  const due = await db.select({ id: reservation.id, dueDate: reservation.dueDate, title: listing.title, courseCode: listing.courseCode, email: user.email, name: user.name, userId: user.id })
    .from(reservation).innerJoin(listing, eq(listing.id, reservation.listingId)).innerJoin(user, eq(user.id, reservation.buyerId))
    .where(and(eq(reservation.status, "handed"), isNull(reservation.remindedAt), lte(reservation.dueDate, sql`(current_date + 3)`)));
  for (const r of due) {
    await sendEmail({
      to: r.email, userId: r.userId, kind: "loan.reminder",
      subject: `Rappel : ${r.courseCode} à rendre le ${fmtDate(r.dueDate!)}`,
      text: `Bonjour ${r.name.split(" ")[0]},\n\nPetit rappel : « ${r.title} » doit être rendu le ${fmtDate(r.dueDate!)}. Écris à la personne qui te l’a prêté pour convenir du lieu.\n\nOkoumé`,
    });
    await db.update(reservation).set({ remindedAt: new Date() }).where(eq(reservation.id, r.id));
  }
  const now = new Date();
  const s = await db.delete(session).where(lt(session.expiresAt, now)).returning({ id: session.id });
  const v = await db.delete(verification).where(lt(verification.expiresAt, now)).returning({ id: verification.id });
  const rl = await db.delete(rateLimit).where(lt(rateLimit.lastRequest, Date.now() - 1000 * 60 * 60 * 24)).returning({ id: rateLimit.id });
  const o = await db.delete(emailOutbox).where(lt(emailOutbox.createdAt, sql`now() - interval '90 days'`)).returning({ id: emailOutbox.id });
  const a = await db.delete(auditLog).where(lt(auditLog.createdAt, sql`now() - interval '365 days'`)).returning({ id: auditLog.id });
  // Sign-ups never confirmed after 7 days are deleted (retention promised in /confidentialite).
  const u = await db.delete(user).where(and(eq(user.emailVerified, false), lt(user.createdAt, sql`now() - interval '7 days'`))).returning({ id: user.id });
  return { reminders: due.length, sessions: s.length, verifications: v.length, rateLimits: rl.length, outbox: o.length, audit: a.length, unverifiedUsers: u.length };
}
