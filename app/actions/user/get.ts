"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Get all tests created by a user
 */
export async function getUserCreatedTests() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const tests = await prisma.test.findMany({
      where: {
        creatorId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: tests,
    };
  } catch (error) {
    console.error("Error fetching user created tests:", error);
    return {
      success: false,
      error: "Failed to fetch created tests",
    };
  }
}

/**
 * Get all tests taken by a user (as a participant)
 */
export async function getUserTakenTests() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const participants = await prisma.participant.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        test: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      participants,
    };
  } catch (error) {
    console.error("Error fetching user taken tests:", error);
    return {
      success: false,
      error: "Failed to fetch taken tests",
    };
  }
}
