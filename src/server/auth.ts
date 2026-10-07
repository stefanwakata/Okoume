import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { env, appUrl } from "@/lib/env";
import { queueEmail } from "@/server/email";
import { APIError } from "better-auth/api";
import { and, eq, inArray } from "drizzle-orm";
import { SCHOOLS } from "@/lib/sections";

export const auth = betterAuth({
  appName: "Okoumé",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: appUrl,
  trustedOrigins: [appUrl],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 15, // ASVS 6.2.1: 15 when the password is the only factor
    maxPasswordLength: 128,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 30,
    sendResetPassword: async ({ user, url }) => {
      queueEmail({
        to: user.email, kind: "reset", userId: user.id,
        subject: "Choisir un nouveau mot de passe Okoumé",
        text: `Bonjour ${user.name},\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valide 30 minutes) :\n${url}\n\nSi tu n’as rien demandé, ignore ce courriel. Ton mot de passe actuel reste valide.\n\nOkoumé`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      queueEmail({
        to: user.email, kind: "verify", userId: user.id,
        subject: "Confirme ton adresse Okoumé",
        text: `Bonjour ${user.name},\n\nConfirme ton adresse avec ce lien (valide 24 heures) :\n${url}\n\nEnsuite, quelqu’un du comité de l’asso valide ton compte. Tu pourras alors publier et réserver des livres.\n\nSi tu ne t’es pas inscrit sur Okoumé, ignore ce courriel.\n\nOkoumé`,
      });
    },
  },
  user: {
    additionalFields: {
      school: { type: "string", required: false, input: true },
      memberStatus: { type: ["pending", "approved", "suspended"], required: false, input: false, defaultValue: "pending" },
    },
    deleteUser: {
      enabled: true,
      // A deleted account must not leave a book stuck as "reserved" or "lent" on the shelf.
      beforeDelete: async (u) => {
        const { listing, reservation } = schema;
        const lending = await db.select({ id: reservation.id }).from(reservation).innerJoin(listing, eq(listing.id, reservation.listingId))
          .where(and(eq(reservation.status, "handed"), eq(listing.sellerId, u.id))).limit(1);
        const borrowing = await db.select({ id: reservation.id }).from(reservation)
          .where(and(eq(reservation.status, "handed"), eq(reservation.buyerId, u.id))).limit(1);
        if (lending.length || borrowing.length) {
          throw new APIError("BAD_REQUEST", { message: "Un prêt est en cours. Une fois le livre rendu, tu pourras supprimer ton compte." });
        }
        const held = await db.select({ listingId: reservation.listingId }).from(reservation)
          .where(and(eq(reservation.buyerId, u.id), inArray(reservation.status, ["accepted"])));
        if (held.length) await db.update(listing).set({ status: "available" }).where(inArray(listing.id, held.map((h) => h.listingId)));
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Server-side check of the sign-up fields the client sends (the API is public).
        before: async (u) => {
          const name = String(u.name ?? "").trim();
          const school = (u as { school?: unknown }).school;
          if (name.length < 2 || name.length > 60) throw new APIError("BAD_REQUEST", { message: "Le nom doit faire entre 2 et 60 caractères." });
          if (typeof school !== "string" || !(SCHOOLS as readonly string[]).includes(school)) throw new APIError("BAD_REQUEST", { message: "Choisis ton établissement dans la liste." });
          return { data: { ...u, name } };
        },
      },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, freshAge: 60 * 60 * 24 },
  verification: { storeIdentifier: "hashed" },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production" && process.env.E2E !== "1",
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  advanced: {
    database: { generateId: "uuid" },
    ipAddress: { ipAddressHeaders: [env.TRUSTED_IP_HEADER] },
  },
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
