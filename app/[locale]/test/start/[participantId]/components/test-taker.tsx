"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { NavbarTest } from "./navbar-test";
import { QuestionList } from "./question-list";
import { BottomNavbar } from "./bottom-navbar";
import { AnswerEssay } from "./answer-essay";
import { AnswerChoice } from "./answer-choice";
import { AnswerMultipleChoice } from "./answer-multiple-choice";
import { PlateReadOnlyViewer } from "@/components/custom/plate-readonly-viewer";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type QuestionType = "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";

export type Choice = { id: string; choiceText: string };

export type Question = {
  id: string;
  questionText: string;
  type: QuestionType;
  order: string;
  essay?: { id: string; maxScore: number } | null;
  choice?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    choices: Choice[];
  } | null;
  multipleSelect?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    multipleSelectChoices: Choice[];
  } | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts plain text from a serialised Plate JSON string. */
export function extractPlateText(raw: string): string {
  type PlateNode = { text?: string; children?: PlateNode[] };
  const walk = (nodes: PlateNode[]): string =>
    nodes
      .map((n) =>
        typeof n.text === "string"
          ? n.text
          : Array.isArray(n.children)
            ? walk(n.children)
            : "",
      )
      .join("");

  try {
    const parsed = JSON.parse(raw) as PlateNode[];
    return walk(Array.isArray(parsed) ? parsed : []);
  } catch {
    return raw;
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Seeded random number generator for deterministic shuffling
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  return function () {
    hash = (hash * 9301 + 49297) % 233280;
    // Ensure we return a value between 0 and 1 (never negative)
    return Math.abs(hash) / 233280;
  };
}

/**
 * Fisher-Yates shuffle with seeded random for deterministic results
 */
function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const result = [...array];
  const random = seededRandom(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    // Use explicit temp variable instead of destructuring to avoid corruption
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}

// ---------------------------------------------------------------------------
// TestTaker (main client orchestrator)
// ---------------------------------------------------------------------------

interface TestTakerProps {
  participantId: string;
  testTitle: string;
  /** Duration in minutes, or null if no time limit. */
  testDuration: number | null;
  /** ISO string of when the participant record was created. */
  participantCreatedAt: string;
  questions: Question[];
  isQuestionsOrdered: boolean;
  initialEssayAnswers: Record<string, string>;
  initialChoiceAnswers: Record<string, string | null>;
  initialMultipleSelectAnswers: Record<string, string[]>;
  noQuestionsLabel: string;
}

/** Computes remaining seconds from participant creation time and test duration. */
function computeRemainingSeconds(
  participantCreatedAt: string,
  testDurationMinutes: number,
): number {
  const endMs =
    new Date(participantCreatedAt).getTime() + testDurationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
}

export function TestTaker({
  participantId,
  testTitle,
  testDuration,
  participantCreatedAt,
  questions: initialQuestions,
  isQuestionsOrdered,
  initialEssayAnswers,
  initialChoiceAnswers,
  initialMultipleSelectAnswers,
  noQuestionsLabel,
}: TestTakerProps) {
  const t = useTranslations("Pages.testStart");
  const router = useRouter();

  // Deterministically randomize questions based on participantId if not ordered
  // Use useMemo to ensure stable reference across renders
  const questions = useMemo(() => {
    return isQuestionsOrdered
      ? initialQuestions
      : shuffleWithSeed(initialQuestions, participantId);
  }, [isQuestionsOrdered, initialQuestions, participantId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [markedSet, setMarkedSet] = useState<Set<string>>(new Set());

  // Countdown timer — derived from participant.createdAt + testDuration
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    testDuration != null
      ? computeRemainingSeconds(participantCreatedAt, testDuration)
      : null,
  );
  const isFinishingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Draft answers â€” what the user has typed
  // ---------------------------------------------------------------------------
  const [essayDraft, setEssayDraft] =
    useState<Record<string, string>>(initialEssayAnswers);
  const [choiceDraft, setChoiceDraft] =
    useState<Record<string, string | null>>(initialChoiceAnswers);
  const [multiDraft, setMultiDraft] = useState<Record<string, string[]>>(
    initialMultipleSelectAnswers,
  );

  // ---------------------------------------------------------------------------
  // Last successfully committed answers â€” used as rollback snapshots
  // ---------------------------------------------------------------------------
  const committedEssay = useRef<Record<string, string>>({
    ...initialEssayAnswers,
  });
  const committedChoice = useRef<Record<string, string | null>>({
    ...initialChoiceAnswers,
  });
  const committedMulti = useRef<Record<string, string[]>>({
    ...initialMultipleSelectAnswers,
  });

  // ---------------------------------------------------------------------------
  // Shared save helpers
  // ---------------------------------------------------------------------------

  /**
   * Awaited save for the question at `index`.
   * Does not use the pending counter — only used right before finishing,
   * where we need a guaranteed write before the redirect.
   */
  const awaitSaveAtIndex = useCallback(
    async (index: number) => {
      const question = questions[index];
      if (!question) return;
      const qId = question.id;

      if (question.type === "ESSAY") {
        const draft = essayDraft[qId] ?? "";
        const previous = committedEssay.current[qId] ?? "";
        if (draft === previous) return;
        committedEssay.current[qId] = draft;
        await fetch("/api/answer/essay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            questionId: qId,
            answerText: draft,
          }),
        }).catch(() => {
          committedEssay.current[qId] = previous;
        });
      } else if (question.type === "CHOICE") {
        const draft = choiceDraft[qId] ?? null;
        const previous = committedChoice.current[qId] ?? null;
        if (draft === previous) return;
        committedChoice.current[qId] = draft;
        await fetch("/api/answer/choice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            questionId: qId,
            selectedChoiceId: draft,
          }),
        }).catch(() => {
          committedChoice.current[qId] = previous;
        });
      } else if (question.type === "MULTIPLE_SELECT") {
        const draft = multiDraft[qId] ?? [];
        const previous = committedMulti.current[qId] ?? [];
        if (arraysEqual(draft, previous)) return;
        committedMulti.current[qId] = [...draft];
        await fetch("/api/answer/multiple-choice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            questionId: qId,
            selectedChoiceIds: draft,
          }),
        }).catch(() => {
          committedMulti.current[qId] = previous;
        });
      }
    },
    [questions, essayDraft, choiceDraft, multiDraft, participantId],
  );

  // ---------------------------------------------------------------------------
  // Finish handler — awaits save of current question, then marks as completed
  // ---------------------------------------------------------------------------
  const handleFinish = useCallback(async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    await awaitSaveAtIndex(currentIndex);
    await fetch(`/api/participants/${participantId}/finish`, {
      method: "POST",
    });
    router.replace(`/test/result/${participantId}`);
  }, [participantId, router, currentIndex, awaitSaveAtIndex]);

  // ---------------------------------------------------------------------------
  // Countdown interval — ticks every second, auto-finishes when time is up
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (testDuration == null) return;

    const interval = setInterval(() => {
      const remaining = computeRemainingSeconds(
        participantCreatedAt,
        testDuration,
      );
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        void handleFinish();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [testDuration, participantCreatedAt, handleFinish]);

  // ---------------------------------------------------------------------------
  // In-flight request counter — only used to gate the finish-confirm button
  // ---------------------------------------------------------------------------
  const pendingCount = useRef(0);
  const [isPending, setIsPending] = useState(false);

  const incPending = () => {
    pendingCount.current += 1;
    setIsPending(true);
  };
  const decPending = () => {
    pendingCount.current = Math.max(0, pendingCount.current - 1);
    if (pendingCount.current === 0) setIsPending(false);
  };

  // ---------------------------------------------------------------------------
  // Fire-and-forget save with optimistic rollback
  // Snapshot values are captured at the call site so there's no stale-closure issue.
  // ---------------------------------------------------------------------------

  const fireSaveEssay = useCallback(
    (qId: string, draft: string) => {
      const previous = committedEssay.current[qId] ?? "";
      if (draft === previous) return;

      // Optimistically mark as committed
      committedEssay.current[qId] = draft;
      incPending();

      fetch("/api/answer/essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          questionId: qId,
          answerText: draft,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          decPending();
        })
        .catch(() => {
          // Rollback
          committedEssay.current[qId] = previous;
          setEssayDraft((prev) => ({ ...prev, [qId]: previous }));
          decPending();
        });
    },
    [participantId],
  );

  const fireSaveChoice = useCallback(
    (qId: string, draft: string | null) => {
      const previous = committedChoice.current[qId] ?? null;
      if (draft === previous) return;

      committedChoice.current[qId] = draft;
      incPending();

      fetch("/api/answer/choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          questionId: qId,
          selectedChoiceId: draft,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          decPending();
        })
        .catch(() => {
          committedChoice.current[qId] = previous;
          setChoiceDraft((prev) => ({ ...prev, [qId]: previous }));
          decPending();
        });
    },
    [participantId],
  );

  const fireSaveMulti = useCallback(
    (qId: string, draft: string[]) => {
      const previous = committedMulti.current[qId] ?? [];
      if (arraysEqual(draft, previous)) return;

      committedMulti.current[qId] = [...draft];
      incPending();

      fetch("/api/answer/multiple-choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          questionId: qId,
          selectedChoiceIds: draft,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          decPending();
        })
        .catch(() => {
          committedMulti.current[qId] = previous;
          setMultiDraft((prev) => ({ ...prev, [qId]: previous }));
          decPending();
        });
    },
    [participantId],
  );

  /**
   * Fire-and-forget save for the question at `index`.
   * Uses the pending counter so the UI can reflect in-flight state.
   * Used by navigateTo when the user moves between questions.
   */
  const fireSaveAtIndex = useCallback(
    (index: number) => {
      const question = questions[index];
      if (!question) return;
      const qId = question.id;
      if (question.type === "ESSAY") {
        fireSaveEssay(qId, essayDraft[qId] ?? "");
      } else if (question.type === "CHOICE") {
        fireSaveChoice(qId, choiceDraft[qId] ?? null);
      } else if (question.type === "MULTIPLE_SELECT") {
        fireSaveMulti(qId, multiDraft[qId] ?? []);
      }
    },
    [
      questions,
      essayDraft,
      choiceDraft,
      multiDraft,
      fireSaveEssay,
      fireSaveChoice,
      fireSaveMulti,
    ],
  );

  // ---------------------------------------------------------------------------
  // Navigation optimistic: index changes immediately, save fires in background
  // ---------------------------------------------------------------------------

  const toggleMark = useCallback(() => {
    const question = questions[currentIndex];
    if (!question) return;
    setMarkedSet((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });
  }, [questions, currentIndex]);

  const navigateTo = useCallback(
    (nextIndex: number) => {
      // Clamp to valid range before saving
      const validNextIndex = Math.max(
        0,
        Math.min(nextIndex, questions.length - 1),
      );
      fireSaveAtIndex(currentIndex);
      setCurrentIndex(validNextIndex);
    },
    [currentIndex, fireSaveAtIndex, questions.length],
  );

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const answeredSet = new Set<string>([
    ...Object.entries(essayDraft)
      .filter(([, v]) => v.trim() !== "")
      .map(([k]) => k),
    ...Object.entries(choiceDraft)
      .filter(([, v]) => v !== null)
      .map(([k]) => k),
    ...Object.entries(multiDraft)
      .filter(([, v]) => v.length > 0)
      .map(([k]) => k),
  ]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCurrentMarked =
    currentQuestion != null && markedSet.has(currentQuestion.id);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{noQuestionsLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navbar */}
      <NavbarTest testTitle={testTitle} secondsRemaining={secondsRemaining} />

      {/* Main content */}
      <div className="flex flex-1 gap-4 p-4 pb-24 md:p-6 md:pb-28">
        {/* Question area */}
        <main className="flex flex-1 min-w-0 flex-col gap-6">
          {/* Question text */}
          <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <p
              className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide"
              data-testid="question-count"
            >
              {t("questionCount", {
                current: currentIndex + 1,
                total: questions.length,
              })}
            </p>
            <div
              data-testid="question-text-display"
              className="prose prose-sm max-w-none dark:prose-invert overflow-hidden"
            >
              <PlateReadOnlyViewer
                key={currentQuestion.id}
                value={currentQuestion.questionText}
                className="text-base leading-relaxed wrap-break-word"
              />
            </div>
          </div>

          {/* Answer area */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            {currentQuestion.type === "ESSAY" && (
              <AnswerEssay
                questionId={currentQuestion.id}
                value={essayDraft[currentQuestion.id] ?? ""}
                onChange={(v) =>
                  setEssayDraft((prev) => ({
                    ...prev,
                    [currentQuestion.id]: v,
                  }))
                }
              />
            )}

            {currentQuestion.type === "CHOICE" && currentQuestion.choice && (
              <AnswerChoice
                questionId={currentQuestion.id}
                choices={currentQuestion.choice.choices}
                value={choiceDraft[currentQuestion.id] ?? null}
                onChange={(v) =>
                  setChoiceDraft((prev) => ({
                    ...prev,
                    [currentQuestion.id]: v,
                  }))
                }
              />
            )}

            {currentQuestion.type === "MULTIPLE_SELECT" &&
              currentQuestion.multipleSelect && (
                <AnswerMultipleChoice
                  questionId={currentQuestion.id}
                  choices={currentQuestion.multipleSelect.multipleSelectChoices}
                  value={multiDraft[currentQuestion.id] ?? []}
                  onChange={(v) =>
                    setMultiDraft((prev) => ({
                      ...prev,
                      [currentQuestion.id]: v,
                    }))
                  }
                />
              )}
          </div>
        </main>

        {/* Question list sidebar – desktop inline, toggled */}
        {isQuestionListOpen && (
          <aside className="hidden w-48 shrink-0 md:block">
            <QuestionList
              questions={questions}
              currentIndex={currentIndex}
              answeredSet={answeredSet}
              markedSet={markedSet}
              onSelect={(i) => navigateTo(i)}
            />
          </aside>
        )}
      </div>

      {/* Question list panel – mobile overlay above bottom nav */}
      {isQuestionListOpen && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
          <QuestionList
            questions={questions}
            currentIndex={currentIndex}
            answeredSet={answeredSet}
            markedSet={markedSet}
            onSelect={(i) => {
              navigateTo(i);
              setIsQuestionListOpen(false);
            }}
          />
        </div>
      )}

      {/* Bottom navigation */}
      <BottomNavbar
        hasPrev={currentIndex > 0}
        isLast={isLastQuestion}
        isPending={isPending}
        isQuestionListOpen={isQuestionListOpen}
        isMarked={isCurrentMarked}
        onPrev={() => navigateTo(currentIndex - 1)}
        onNext={() => navigateTo(currentIndex + 1)}
        onToggleQuestionList={() => setIsQuestionListOpen((v) => !v)}
        onToggleMark={toggleMark}
        onSaveBeforeDialog={() => fireSaveAtIndex(currentIndex)}
        onFinish={handleFinish}
      />
    </div>
  );
}
