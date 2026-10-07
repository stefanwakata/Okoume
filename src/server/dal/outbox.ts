import "server-only";
import { desc, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { emailOutbox } from "@/server/db/schema";
import { isDemo } from "@/lib/env";
import { notFound } from "@/server/errors";

/** Demo only: the last emails the app "sent". Disabled (404) when DEMO_MODE is off.
 *  Password-reset emails are never shown: the page is public, a reset link would let anyone take over an account. */
export async function demoOutbox() {
  if (!isDemo) throw notFound();
  return db.select({ id: emailOutbox.id, to: emailOutbox.to, subject: emailOutbox.subject, text: emailOutbox.text, kind: emailOutbox.kind, createdAt: emailOutbox.createdAt })
    .from(emailOutbox).where(ne(emailOutbox.kind, "reset")).orderBy(desc(emailOutbox.createdAt)).limit(30);
}
