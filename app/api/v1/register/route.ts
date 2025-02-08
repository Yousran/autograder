import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // Cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Hash password sebelum menyimpan ke database
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database
    await prisma.user.create({
      data: {
        username,
        email,
        password: password,
        role_id: 2,
      },
    });

    return NextResponse.json({ message: "User registered successfully!" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
