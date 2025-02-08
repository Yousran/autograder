import { NextResponse } from "next/server";

export async function POST() {
  // In a real-world scenario, you might want to invalidate the token here
  return NextResponse.json({ message: "Logged out successfully" });
}