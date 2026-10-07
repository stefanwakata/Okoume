import { db } from "@/server/db";
import { listing, reservation, user, session } from "@/server/db/schema";
import { flushEmails } from "@/server/email";

let n = 0;
type Status = "pending" | "approved" | "suspended";

export async function makeUser(opts: { status?: Status; admin?: boolean; verified?: boolean; name?: string; createdAt?: Date } = {}) {
  n++;
  const [u] = await db.insert(user).values({
    name: opts.name ?? `Personne ${n} Test`, email: `p${n}-${Date.now()}@test.ca`, emailVerified: opts.verified ?? true,
    role: opts.admin ? "admin" : "user", memberStatus: opts.status ?? "approved", school: "UQAM",
    ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
  }).returning();
  return u;
}

const g = globalThis as unknown as { __signedIn?: { user: unknown } };
const signedIn = (g.__signedIn ??= { user: null });

export function as(u: { id: string; name: string; email: string; role: string | null; memberStatus: string | null; emailVerified: boolean; banned?: boolean | null } | null) {
  signedIn.user = u ? { id: u.id, name: u.name, email: u.email, role: u.role ?? "user", memberStatus: u.memberStatus ?? "pending", emailVerified: u.emailVerified, banned: !!u.banned } : null;
}

export async function makeListing(sellerId: string, opts: Partial<typeof listing.$inferInsert> = {}) {
  const [l] = await db.insert(listing).values({
    sellerId, section: "sciences", courseCode: "MAT 1400", title: "Calcul", edition: "8e édition", school: "UQAM",
    condition: "Bon", kind: "sale", priceCents: 4500, meetingPlace: "Pavillon A", spineColor: "#7a2e2a", ...opts,
  }).returning();
  return l;
}

export async function makeReservation(listingId: string, buyerId: string, status: typeof reservation.$inferInsert["status"] = "requested", extra: Partial<typeof reservation.$inferInsert> = {}) {
  const [r] = await db.insert(reservation).values({ listingId, buyerId, status, ...extra }).returning();
  return r;
}

export async function makeSession(userId: string) {
  await db.insert(session).values({ userId, token: `t-${Math.random()}`, expiresAt: new Date(Date.now() + 864e5), updatedAt: new Date() });
}

export const settle = flushEmails;
