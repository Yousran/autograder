import { prisma } from "@/lib/prisma";
import { llm } from "@/lib/llm";

type EssayQuestionGradeContext = {
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
  questionText?: string;
};

type GradeMessages = { exactMatch: string; noMatch: string };

/**
 * Grades an essay answer using either exact matching or AI-powered grading.
 * If `isExactAnswer` is true, performs case-insensitive trimmed comparison (full score or 0).
 * If `isExactAnswer` is false, uses AI (via OpenRouter) to grade intelligently.
 * Falls back to 0 score if AI grading fails.
 *
 * @param question - The essay question context with answer key and scoring config
 * @param participantAnswer - The participant's written response
 * @param messages - Localized messages for exact match/no match feedback
 * @param questionText - The original question text (used for AI context)
 * @returns Promise with { score, scoreExplanation } where explanation may be null on errors
 */
export async function gradeEssayAnswer(
  question: EssayQuestionGradeContext,
  participantAnswer: string,
  messages: GradeMessages,
  questionText: string,
): Promise<{ score: number; scoreExplanation: string | null }> {
  if (question.isExactAnswer) {
    const normalize = (s: string) => s.trim().toLowerCase();
    const isMatch =
      normalize(participantAnswer) === normalize(question.answerText);

    return {
      score: isMatch ? question.maxScore : 0,
      scoreExplanation: isMatch ? messages.exactMatch : messages.noMatch,
    };
  }

  // Use AI grading for non-exact answers
  try {
    const result = await llm({
      questionText,
      answer: participantAnswer,
      answerKey: question.answerText,
      minScore: 0,
      maxScore: question.maxScore,
    });
    return {
      score: result.score,
      scoreExplanation: result.explanation,
    };
  } catch (err) {
    console.error("AI grading failed:", err);
    // Fallback to returning 0 score
    return {
      score: 0,
      scoreExplanation: messages.noMatch,
    };
  }
}

/**
 * Asynchronously grades and updates an essay answer.
 * This function runs in the background without blocking the response.
 *
 * @param answerId - The ID of the essay answer to grade
 * @param answerText - The text of the answer
 * @param questionId - The ID of the essay question
 * @param messages - Grading messages (exactMatch, noMatch)
 */
export async function gradeEssayAnswerAsync(
  answerId: string,
  answerText: string,
  questionId: string,
  messages: GradeMessages,
): Promise<void> {
  try {
    const essay = await prisma.essayQuestion.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        answerText: true,
        isExactAnswer: true,
        maxScore: true,
        question: { select: { questionText: true } },
      },
    });

    if (!essay) {
      console.error(`Essay question not found: ${questionId}`);
      return;
    }

    const { score, scoreExplanation } = await gradeEssayAnswer(
      essay,
      answerText,
      messages,
      essay.question.questionText,
    );

    await prisma.essayAnswer.update({
      where: { id: answerId },
      data: { score, scoreExplanation },
    });
  } catch (err) {
    console.error(
      `Failed to grade essay answer ${answerId}:`,
      err instanceof Error ? err.message : "Unknown error",
    );
  }
}
