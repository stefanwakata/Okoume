import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { runDaily } from "@/server/jobs";

// Called once a day by a Render Cron Job: curl -X POST -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/daily
export async function POST(req: Request) {
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${env.CRON_SECRET ?? ""}`);
  if (!env.CRON_SECRET || got.length !== want.length || !timingSafeEqual(got, want)) return new Response("Not found", { status: 404 });
  const result = await runDaily();
  console.info(JSON.stringify({ evt: "cron.daily", ...result }));
  return Response.json(result);
}
