// middleware.ts

//TODO: update middleware to use nodejs runtime to check prisma
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// Tentukan path mana saja yang akan dicek login
export const config = {
  // runtime: "nodejs",
  matcher: ["/test/create", "/test/:joinCode/edit"],
};
