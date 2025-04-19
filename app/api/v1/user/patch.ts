import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { comparePassword, getUserFromToken, signJwt } from "@/lib/auth-server";

const updateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password is required to confirm changes"),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Request body from PATCH:", body);
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/, "");

    const userLoggedIn = await getUserFromToken(token);

    if (!userLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userLoggedIn.userId },
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Cocokkan password lama
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 401 }
      );
    }

    // Cek apakah username/email sudah dipakai oleh user lain
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
        NOT: { id: user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email or username already in use" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username, email },
      select: { id: true, username: true, email: true },
    });

    const res = NextResponse.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
    const newToken = signJwt({
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
    });
    res.cookies.set("token", newToken, {
      httpOnly: false,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });
    return res;
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
