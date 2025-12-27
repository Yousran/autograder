"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function getTestById(testId: string) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    return {
      success: true,
      test,
    };
  } catch (error) {
    console.error("Error getting test by ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get test",
    };
  }
}

export async function getTestByJoinCode(joinCode: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const test = await prisma.test.findUnique({
      where: { joinCode },
    });

    if (!test) {
      return {
        success: false,
        error: "Test not found",
      };
    }

    // Check if user is the creator
    const isCreator = session?.user?.id === test.creatorId;

    // Check if user is logged in when required
    if (test.loggedInUserOnly && !session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to access this test",
      };
    }

    // Check if test is accepting responses (skip for creator)
    if (!test.isAcceptingResponses && !isCreator) {
      return {
        success: false,
        error: "This test is not accepting responses",
      };
    }

    // Check time restrictions
    const now = new Date();
    if (test.startTime && now < test.startTime) {
      return {
        success: false,
        error: "This test has not started yet",
      };
    }

    if (test.endTime && now > test.endTime) {
      return {
        success: false,
        error: "This test has ended",
      };
    }

    return {
      success: true,
      test,
    };
  } catch (error) {
    console.error("Error getting test by join code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get test",
    };
  }
}
