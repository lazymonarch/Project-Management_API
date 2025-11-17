import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware (In-Memory Token Architecture)
 * -----------------------------------------
 * - No server-side authentication (token is stored in memory on client)
 * - No cookie reading (you intentionally removed them)
 * - All real auth/role checks happen client-side using:
 *      → ProtectedClientWrapper
 *      → tokenManager
 *      → backendFetch()
 * 
 * This middleware is ONLY for:
 * - Route shaping
 * - Handling blocked patterns
 * - Future SSR paths (if you ever add cookie-based tokens)
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore static assets, images, special files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Optionally prevent authenticated users from visiting login/register
  // (Since we can't read memory tokens, we keep this disabled)
  //
  // if (pathname === "/login" || pathname === "/register") {
  //   // Example future logic: redirect to dashboard if user already authenticated
  // }

  /**
   * Future SSR-Protected Routes (optional):
   * 
   * If later you switch to cookie-based tokens:
   *   - You can enforce server-side RBAC here
   *   - Example structure kept for future expansion
   * 
   * if (pathname.startsWith("/admin")) {
   *    if (!cookieToken) return redirect("/login")
   *    if (!isAdmin) return redirect("/not-authorized")
   * }
   */

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all pages except:
    // - Static files
    // - Images
    // - Assets
    // - Next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
