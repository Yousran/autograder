// app/api/v1/login/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { comparePassword } from "@/lib/auth";
import { signJwt } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const token = signJwt({
    userId: user.id,
    email: user.email,
    username: user.username,
  });
  

  return NextResponse.json({ token });
}
