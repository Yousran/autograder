"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Question } from "./test-taker";
import { Button } from "@/components/ui/button";

/**
 * Sidebar grid of question number buttons.
 * Highlights the current question, marks answered ones, and shows a flag
 * indicator on questions the user has marked for review.
 */
export function QuestionList({
  questions,
  currentIndex,
  answeredSet,
  markedSet,
  onSelect,
}: {
  questions: Question[];
  currentIndex: number;
  answeredSet: Set<string>;
  /** Set of question IDs that the user has marked for review. */
  markedSet: Set<string>;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("Pages.testStart");

  return (
    <div className="w-fit flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("questionList")}
      </p>
      <div className="flex flex-wrap gap-1.5" role="list">
        {questions.map((q, i) => {
          const isActive = i === currentIndex;
          const isAnswered = answeredSet.has(q.id);
          const isMarked = markedSet.has(q.id);
          return (
            <Button
              key={q.id}
              type="button"
              role="listitem"
              onClick={() => onSelect(i)}
              aria-label={`${t("questionCount", { current: i + 1, total: questions.length })} — ${
                isAnswered ? t("answered") : t("unanswered")
              }${isMarked ? ` — ${t("marked")}` : ""}`}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isAnswered
                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                    : "border bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              {i + 1}
              {/* Mark indicator dot */}
              {isMarked && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 size-2.5 rounded-full bg-amber-500 ring-1 ring-background"
                />
              )}
            </Button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-primary" />
          {t("questionCount", {
            current: currentIndex + 1,
            total: questions.length,
          })}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-green-100 dark:bg-green-900/50" />
          {t("answered")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative inline-block size-3 rounded-sm border bg-muted/40">
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-amber-500" />
          </span>
          {t("marked")}
        </span>
      </div>
    </div>
  );
}
