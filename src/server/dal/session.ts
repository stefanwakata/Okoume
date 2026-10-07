import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { forbidden, unauthorized } from "@/server/errors";

export type Viewer = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  memberStatus: "pending" | "approved" | "suspended";
  emailVerified: boolean;
  banned: boolean;
};

// One session lookup per request (React.cache works in Server Components; actions re-read it).
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { role?: string | null; memberStatus?: string | null; banned?: boolean | null };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "admin" ? "admin" : "user",
    memberStatus: (u.memberStatus as Viewer["memberStatus"]) ?? "pending",
    emailVerified: u.emailVerified,
    banned: !!u.banned,
  };
});

export async function requireUser(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) throw unauthorized();
  if (v.banned || v.memberStatus === "suspended") throw forbidden("Ce compte est suspendu. Écris au comité de l’asso si c’est une erreur.");
  return v;
}

/** Approved member of the association (or admin). */
export async function requireMember(): Promise<Viewer> {
  const v = await requireUser();
  if (v.role === "admin") return v;
  if (v.memberStatus !== "approved") throw forbidden("Ton compte attend la validation du comité de l’asso.");
  return v;
}

export async function requireAdmin(): Promise<Viewer> {
  const v = await requireUser();
  if (v.role !== "admin") throw forbidden();
  return v;
}

export const isMember = (v: Viewer | null) => !!v && !v.banned && (v.role === "admin" || v.memberStatus === "approved");
