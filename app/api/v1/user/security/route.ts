import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth-server";

const updateSchema = z.object({
  oldPassword: z.string().min(6, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const { oldPassword, newPassword, confirmPassword } = parsed.data;

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "New password and confirm password do not match" },
        { status: 400 }
      );
    }

    const userLoggedIn = await getCurrentUser(req);

    if (!userLoggedIn) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the user's credential account to verify old password
    const account = await prisma.account.findFirst({
      where: {
        userId: userLoggedIn.id,
        providerId: "credential",
      },
    });

    if (!account || !account.password) {
      return NextResponse.json(
        { message: "No password set for this account" },
        { status: 400 }
      );
    }

    // Use Better Auth to change password
    try {
      await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword: oldPassword,
        },
        headers: req.headers,
      });

      return NextResponse.json(
        { message: "Password updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { message: "Incorrect old password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
