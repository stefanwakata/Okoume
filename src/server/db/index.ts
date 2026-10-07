import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

// One pool per server process (Render runs a long-lived Node server). Pooled URL for app traffic.
const g = globalThis as unknown as { okoumePool?: Pool };
export const pool = g.okoumePool ?? new Pool({ connectionString: env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== "production") g.okoumePool = pool;

export const db = drizzle({ client: pool, schema });
export type DB = typeof db;
