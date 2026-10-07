// Applies pending SQL migrations from ./drizzle. Runs before each deploy (Render preDeployCommand).
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL manquant"); process.exit(1); }
const pool = new Pool({ connectionString: url, max: 1 });
async function main() {
  await migrate(drizzle({ client: pool }), { migrationsFolder: "./drizzle" });
  console.log(JSON.stringify({ evt: "db.migrated" }));
}
main()
  .catch((e) => { console.error(JSON.stringify({ evt: "db.migrate_failed", err: String(e) })); process.exitCode = 1; })
  .finally(() => pool.end());
