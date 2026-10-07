import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { emailOutbox } from "@/server/db/schema";
import { env } from "@/lib/env";

type Mail = { to: string; subject: string; text: string; kind: string; userId?: string | null };

// Every email is stored first (never lost), then sent through Resend's REST API if a key is configured.
export async function sendEmail(mail: Mail) {
  const [row] = await db.insert(emailOutbox).values({ ...mail, userId: mail.userId ?? null }).returning({ id: emailOutbox.id });
  if (!env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "test") console.info(JSON.stringify({ evt: "email.stored", kind: mail.kind, id: row.id }));
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text }),
      signal: AbortSignal.timeout(8000),
    });
    await db.update(emailOutbox).set(res.ok ? { status: "sent" } : { status: "failed", error: `HTTP ${res.status}` }).where(eq(emailOutbox.id, row.id));
  } catch (e) {
    await db.update(emailOutbox).set({ status: "failed", error: String(e).slice(0, 300) }).where(eq(emailOutbox.id, row.id));
  }
}

const pending = new Set<Promise<void>>();

// Fire and forget, for auth callbacks (do not reveal timing) and non-blocking notifications.
export function queueEmail(mail: Mail) {
  const p = sendEmail(mail).catch((e) => console.error(JSON.stringify({ evt: "email.error", kind: mail.kind, err: String(e) })));
  pending.add(p);
  void p.finally(() => pending.delete(p));
}

/** Waits for queued emails (tests, graceful shutdown). */
export async function flushEmails() {
  await Promise.all([...pending]);
}
