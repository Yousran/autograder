"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditableNumberInput } from "@/components/custom/editable-number-input";
import { QuestionWithDetails } from "@/lib/schemas/question";
import { useQuestions } from "../../../context/question-context";

export function MaxScoreEditable({
  question,
}: {
  question: QuestionWithDetails;
}) {
  const t = useTranslations("Api.questions");
  const { updateQuestion } = useQuestions();

  const handleUpdate = useCallback(
    async (value: number | null) => {
      try {
        const res = await fetch(`/api/questions/${question.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maxScore: value,
            type: question.type,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error((data as { error?: string }).error ?? t("updateFailed"));
          return;
        }

        if (value !== null) {
          if (question.type === "ESSAY") {
            updateQuestion(question.id, {
              essay: question.essay
                ? { ...question.essay, maxScore: value }
                : undefined,
            });
          } else if (question.type === "CHOICE") {
            updateQuestion(question.id, {
              choice: question.choice
                ? { ...question.choice, maxScore: value }
                : undefined,
            });
          } else if (question.type === "MULTIPLE_SELECT") {
            updateQuestion(question.id, {
              multipleSelect: question.multipleSelect
                ? { ...question.multipleSelect, maxScore: value }
                : undefined,
            });
          }
        }
        toast.success(t("updateSuccess"));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("updateFailed");
        toast.error(message);
      }
    },
    [question, t, updateQuestion],
  );

  return (
    <EditableNumberInput
      initialValue={
        question.essay?.maxScore ??
        question.choice?.maxScore ??
        question.multipleSelect?.maxScore ??
        null
      }
      onUpdate={handleUpdate}
      data-testid="input-max-score"
    />
  );
}
