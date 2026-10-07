import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic check only (cookie present?). Real authorization happens in the DAL on every read and write.
export function proxy(req: NextRequest) {
  if (!getSessionCookie(req)) {
    const url = new URL("/connexion", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/compte/:path*", "/publier", "/admin/:path*"] };
