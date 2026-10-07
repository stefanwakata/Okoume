"use client";
import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/server/auth";

// All auth calls go through /api/auth so Better Auth's rate limits and origin checks apply.
export const authClient = createAuthClient({ plugins: [adminClient(), inferAdditionalFields<typeof auth>()] });

/** Better Auth error codes → French messages. Unknown codes get a neutral message (never the raw text). */
export function authMessage(err: { code?: string; message?: string; status?: number } | null | undefined): string {
  switch (err?.code) {
    case "INVALID_EMAIL_OR_PASSWORD": return "Courriel ou mot de passe incorrect.";
    case "EMAIL_NOT_VERIFIED": return "Confirme d’abord ton adresse : on vient de te renvoyer le lien.";
    case "PASSWORD_TOO_SHORT": return "Le mot de passe doit faire au moins 15 caractères.";
    case "PASSWORD_TOO_LONG": return "Le mot de passe doit faire au plus 128 caractères.";
    case "INVALID_TOKEN": return "Ce lien n’est plus valide. Demande-en un nouveau.";
    case "INVALID_PASSWORD": return "Mot de passe incorrect.";
  }
  if (err?.status === 429) return "Trop d’essais en peu de temps. Attends une minute avant de réessayer.";
  if (err?.status === 400 && err.message && /[éèàç]/.test(err.message)) return err.message; // our own French APIError messages
  return "Quelque chose n’a pas marché. Réessaie dans un instant.";
}
