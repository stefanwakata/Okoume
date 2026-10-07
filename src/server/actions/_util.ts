import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { AppError } from "@/server/errors";

export type ActionState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string> };

export function fieldErrors(err: z.ZodError) {
  return z.flattenError(err).fieldErrors as Record<string, string[] | undefined>;
}

/** Expected errors become messages; anything else is logged and shown as a generic failure (never a stack trace). */
export function toState(e: unknown): ActionState {
  if (e instanceof AppError) return { ok: false, message: e.message };
  if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
  console.error(JSON.stringify({ evt: "action.error", err: String(e) }));
  return { ok: false, message: "Quelque chose n’a pas marché de notre côté. Réessaie dans un instant." };
}

/** Flash message shown once on the next page (short-lived, not sensitive). */
export async function flash(message: string) {
  (await cookies()).set("okoume_flash", encodeURIComponent(message), { path: "/", maxAge: 20, sameSite: "lax", httpOnly: false });
}

export const formValues = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([k, v]) => !k.startsWith("$ACTION") && typeof v === "string")) as Record<string, string>;
