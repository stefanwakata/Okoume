import { vi, beforeEach, afterAll } from "vitest";

// The only fake: who is signed in. Everything else (DAL, SQL, constraints, outbox) is real.
type FakeUser = { id: string; name: string; email: string; role: string; memberStatus: string; emailVerified: boolean; banned: boolean };
const state = vi.hoisted(() => {
  const g = globalThis as unknown as { __signedIn?: { user: FakeUser | null } };
  return (g.__signedIn ??= { user: null });
});

vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined, set: () => {} }) }));
vi.mock("@/server/auth", () => ({ auth: { api: { getSession: async () => (state.user ? { user: state.user, session: {} } : null) } } }));

beforeEach(async () => {
  state.user = null;
  const { db } = await import("@/server/db");
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`truncate table audit_log, email_outbox, reservation, listing, session, account, verification, rate_limit, "user" cascade`);
});

afterAll(async () => {
  const { flushEmails } = await import("@/server/email");
  await flushEmails();
  const { pool } = await import("@/server/db");
  await pool.end();
});
