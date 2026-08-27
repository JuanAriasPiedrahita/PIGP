import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/session";
import { verifyLiderSessionToken, LIDER_COOKIE_NAME } from "@/lib/liderSession";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // --- Zona de captura para líderes (sesión propia, distinta a la del admin) ---
  if (pathname.startsWith("/captura") || pathname.startsWith("/api/captura")) {
    if (pathname === "/captura/login" || pathname.startsWith("/api/captura/auth")) {
      return NextResponse.next();
    }
    const lider = await verifyLiderSessionToken(req.cookies.get(LIDER_COOKIE_NAME)?.value);
    if (lider) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/captura/login", req.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // --- Panel de administración (sesión de users.txt) ---
  const usuario = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (usuario) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|uploads).*)"],
};
