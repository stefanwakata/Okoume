import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/server/db";
import { emailOutbox } from "@/server/db/schema";
import { isDemo } from "@/lib/env";
import { notFound } from "@/server/errors";

/** Demo only: the last emails the app "sent". Disabled (404) when DEMO_MODE is off. */
export async function demoOutbox() {
  if (!isDemo) throw notFound();
  return db.select({ id: emailOutbox.id, to: emailOutbox.to, subject: emailOutbox.subject, text: emailOutbox.text, kind: emailOutbox.kind, createdAt: emailOutbox.createdAt })
    .from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(30);
}
