export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env"); // fail fast on bad configuration
  }
}
