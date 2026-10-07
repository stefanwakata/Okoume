import { z } from "zod";

// Validated at boot (instrumentation.ts): a missing secret fails the start, not a user request.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET: au moins 32 caractères"),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("Okoumé <onboarding@resend.dev>"),
  DEMO_MODE: z.enum(["0", "1"]).default("0"),
  CRON_SECRET: z.string().min(16).optional(),
  // The one client-IP header your host's proxy sets and overwrites (verify on Render before launch).
  TRUSTED_IP_HEADER: z.string().default("x-forwarded-for"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Variables d’environnement invalides :", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}
export const env = parsed.data;
export const isDemo = env.DEMO_MODE === "1";
export const appUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");
