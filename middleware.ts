// middleware.ts

//TODO: update middleware to use public
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/profile"]; // Hanya path tertentu yang dilindungi
const PUBLIC_PATHS = ["/"]; // Path yang bersifat publik

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected && !isPublic && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// Tentukan path mana saja yang akan dicek login
export const config = {
  matcher: ["/test/:path*"], // Semua path di bawah /test akan dicek
};
