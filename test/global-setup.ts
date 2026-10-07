import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Fresh schema once per run: drop everything, apply the real migrations.
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/okoume_test";
  if (!/_test$/.test(new URL(url).pathname)) throw new Error("Refusing to reset a database whose name does not end with _test");
  const pool = new Pool({ connectionString: url, max: 1 });
  await pool.query("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  await migrate(drizzle({ client: pool }), { migrationsFolder: "./drizzle" });
  await pool.end();
}
