import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and auth callback bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Fast-path: Check demo/local session cookie
  const sessionCookie = request.cookies.get("pharmapulse_session")?.value;
  const isDemoAuthenticated = sessionCookie === "active" || sessionCookie === "demo";

  // Check Supabase session
  let supabaseUser = null;
  let hasSupabaseCookie = false;
  let supabaseResponse = NextResponse.next({ request });

  try {
    const res = await updateSession(request);
    supabaseResponse = res.supabaseResponse;
    supabaseUser = res.user;
    hasSupabaseCookie = res.hasAuthCookie;
  } catch (e) {
    // Supabase network or configuration error should not crash middleware
    console.error("Middleware updateSession error:", e);
  }

  const isAuthenticated = isDemoAuthenticated || !!supabaseUser || hasSupabaseCookie;
  const isLoginPage = pathname === "/login";

  // RULE 1: Never redirect away from /login in middleware.
  // This guarantees that the login page remains completely stable with 0 circular bounce loops.
  if (isLoginPage) {
    return supabaseResponse;
  }

  // RULE 2: Directly permit /pos and automatically attach demo session if not present.
  // This ensures the POS counter terminal is immediately accessible without any session hurdles.
  if (pathname === "/pos") {
    const res = NextResponse.next({ request });
    if (!sessionCookie) {
      res.cookies.set("pharmapulse_session", "active", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });
    }
    return res;
  }

  // RULE 3: For other protected pages (/dashboard, /inventory, /orders, etc.),
  // if not authenticated, redirect once to /login with target redirect.
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
