import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, context: { params: { username: string } }) {
  try {
    const { username } = context.params; // ✅ Ambil username dari context

    const user = await prisma.user.findFirst({
      where: { username },
      select: { id: true, username: true, email: true, role_id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}