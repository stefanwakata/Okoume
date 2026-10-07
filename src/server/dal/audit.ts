import "server-only";
import { db } from "@/server/db";
import { auditLog } from "@/server/db/schema";

export async function audit(actorId: string | null, action: string, targetType: string, targetId: string | null, details?: Record<string, unknown>) {
  await db.insert(auditLog).values({ actorId, action, targetType, targetId, details: details ?? null });
  console.info(JSON.stringify({ evt: "audit", action, targetType, targetId, actorId }));
}
