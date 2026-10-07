import { exportMyData } from "@/server/dal/account";
import { AppError } from "@/server/errors";

export async function GET() {
  try {
    const data = await exportMyData();
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="okoume-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof AppError && (e.code === "unauthorized" || e.code === "forbidden")) return new Response("Connecte-toi d’abord.", { status: 401 });
    throw e;
  }
}
