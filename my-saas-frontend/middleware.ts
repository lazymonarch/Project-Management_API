import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Option A Middleware (Memory-token compatible)
 * -------------------------------------------------
 * - Does NOT attempt to authenticate users (because access token lives only in memory)
 * - Does NOT read Authorization header (browser never sends it)
 * - Does NOT redirect based on auth
 * 
 * All authentication + authorization happens client-side
 * using ProtectedClientWrapper + tokenManager + backendFetch.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Logging or future utilities can go here if needed.
  // For now, all routes simply continue.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
