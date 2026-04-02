"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { EditableTextarea } from "@/components/custom/editable-textarea";
import { IsExactAnswerToggle } from "./is-exact-answer-toggle";
import { MaxScoreEditable } from "./max-score-editable";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { QuestionWithDetails } from "@/lib/schemas/question";
import { useQuestions } from "../../../context/question-context";

export function QuestionEssay({ question }: { question: QuestionWithDetails }) {
  const t = useTranslations();
  const { updateQuestion } = useQuestions();

  const handleUpdate = useCallback(
    async (value: string) => {
      // Snapshot: Save current state
      const previousData = question.essay?.answerText ?? "";

      // Optimistic Apply: Update UI immediately
      updateQuestion(question.id, {
        essay: question.essay
          ? { ...question.essay, answerText: value }
          : undefined,
      });

      try {
        // Execution: Make API call
        const res = await fetch(`/api/questions/${question.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answerText: value,
            type: QuestionType.ESSAY,
          }),
        });

        if (!res.ok) {
          // Reconciliation: Rollback on error
          updateQuestion(question.id, {
            essay: question.essay
              ? { ...question.essay, answerText: previousData }
              : undefined,
          });
        }
      } catch {
        // Reconciliation: Rollback on error
        updateQuestion(question.id, {
          essay: question.essay
            ? { ...question.essay, answerText: previousData }
            : undefined,
        });
      }
    },
    [question.id, question.essay, updateQuestion],
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="answer"
          className="text-sm font-medium"
          data-testid="label-essay-answer"
        >
          {t("Components.questionsTab.essayAnswerLabel")}
        </Label>
        <EditableTextarea
          id="answer"
          placeholder={t("Components.questionsTab.essayAnswerPlaceholder")}
          initialValue={question.essay?.answerText ?? ""}
          onUpdate={handleUpdate}
          className="min-h-20"
          data-testid="textarea-essay-answer"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label
            className="text-sm font-medium"
            data-testid="label-answer-matching"
          >
            {t("Components.questionsTab.answerMatchingLabel")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {question.essay?.isExactAnswer
              ? t("Components.questionsTab.answerMatchingExact")
              : t("Components.questionsTab.answerMatchingPartial")}
          </p>
        </div>
        <IsExactAnswerToggle question={question} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label className="text-sm font-medium" data-testid="label-max-score">
            {t("Components.questionsTab.maxScoreLabel")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("Components.questionsTab.maxScoreDescription")}
          </p>
        </div>
        <MaxScoreEditable question={question} />
      </div>
    </div>
  );
}
