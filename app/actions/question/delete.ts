"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function deleteQuestion(questionId: string) {
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

    // Get the question and verify ownership through test
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        test: true,
      },
    });

    if (!question) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    if (question.test.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to delete this question",
      };
    }

    // Delete the question (cascade will handle related data)
    await prisma.question.delete({
      where: { id: questionId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting question:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete question",
    };
  }
}
