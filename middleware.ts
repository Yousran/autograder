// app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";  // Menggunakan jose untuk Edge runtime

const PUBLIC_PATHS = [
  "/auth/login", 
  "/auth/register", 
  "/api/v1/login", 
  "/api/v1/register",
  "/api/v1/test/show",
  "/api/v1/participant/store",
  "/api/v1/participant/show",
  "/api/v1/participant/update",
  "/api/v1/answer/essay/update",
  "/api/v1/answer/choice/update",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lewati jika path termasuk public
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Ambil token dari cookies
  const token = req.cookies.get("token")?.value;

  // Jika tidak ada token, redirect ke halaman login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);  // Verifikasi token menggunakan `jose`
    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}

export const config = {
  matcher: [
    "/test/create",
    "/test/:path*/edit",
    "/profile/:path*/edit",
    "/api/v1/:path*",
  ],
};
