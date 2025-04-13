// app/api/v1/register/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { username, email, password } = await req.json();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ message: "Email already used" }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, username, password: hashedPassword },
  });

  return NextResponse.json({ message: "User registered successfully", userId: user.id });
}
