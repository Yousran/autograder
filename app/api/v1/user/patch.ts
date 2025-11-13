import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-helpers";

const updateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
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

    const { name, email } = parsed.data;

    const userLoggedIn = await getCurrentUser(req);

    if (!userLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Cek apakah email sudah dipakai oleh user lain
    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userLoggedIn.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }

    // Update user with Better Auth
    const updatedUser = await prisma.user.update({
      where: { id: userLoggedIn.id },
      data: { name, email },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
