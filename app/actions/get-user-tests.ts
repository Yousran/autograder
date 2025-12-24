"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { headers } from "next/headers";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export async function getUserCreatedTests() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const tests = await prisma.test.findMany({
      where: {
        creatorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        joinCode: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, tests };
  } catch (error) {
    console.error("Error fetching user tests:", error);
    return { error: "Failed to fetch tests" };
  }
}

export async function getUserTakenTest() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const participants = await prisma.participant.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        score: true,
        createdAt: true,
        test: {
          select: {
            id: true,
            title: true,
            joinCode: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, taken: participants };
  } catch (error) {
    console.error("Error fetching taken tests:", error);
    return { error: "Failed to fetch taken tests" };
  }
}
