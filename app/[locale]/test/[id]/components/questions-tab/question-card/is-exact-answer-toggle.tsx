"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { QuestionWithDetails } from "@/lib/schemas/question";
import { useQuestions } from "../../../context/question-context";
import { useSync } from "../../../context/sync-context";

export function IsExactAnswerToggle({
  question,
}: {
  question: QuestionWithDetails;
}) {
  const t = useTranslations();
  const [checked, setChecked] = useState(
    question.essay?.isExactAnswer ?? false,
  );
  const [isLoading, setIsLoading] = useState(false);
  const { setSaving, setSaved, setError } = useSync();
  const { updateQuestion } = useQuestions();

  async function handleCheckedChange(next: boolean) {
    if (isLoading) return;
    // Update Switch state first (immediate visual feedback)
    setChecked(next);
    setIsLoading(true);
    setSaving(true);
    setSaved(false);

    // Snapshot: Save current state
    const previousData = question.essay?.isExactAnswer ?? false;

    // Then update local data
    updateQuestion(question.id, {
      essay: question.essay
        ? { ...question.essay, isExactAnswer: next }
        : undefined,
    });

    try {
      // Execution: Make API call
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isExactAnswer: next,
          type: QuestionType.ESSAY,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          (data as { error?: string }).error ?? t("Api.questions.updateFailed");
        setError(errorMsg);
        // Reconciliation: Rollback on error
        setChecked(previousData);
        updateQuestion(question.id, {
          essay: question.essay
            ? { ...question.essay, isExactAnswer: previousData }
            : undefined,
        });
        return;
      }

      setSaved(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("Api.questions.updateFailed"),
      );
      // Reconciliation: Rollback on error
      setChecked(previousData);
      updateQuestion(question.id, {
        essay: question.essay
          ? { ...question.essay, isExactAnswer: previousData }
          : undefined,
      });
    } finally {
      setIsLoading(false);
      setSaving(false);
    }
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleCheckedChange}
      data-testid="toggle-is-exact-answer"
    />
  );
}
