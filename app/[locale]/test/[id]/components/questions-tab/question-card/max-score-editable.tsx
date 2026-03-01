"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditableNumberInput } from "@/components/custom/editable-number-input";
import { QuestionType } from "@/lib/generated/prisma/enums";

interface Props {
  questionId: string;
  initialValue: number | null;
  questionType?: QuestionType;
}

export function MaxScoreEditable({
  questionId,
  initialValue,
  questionType = QuestionType.ESSAY,
}: Props) {
  const t = useTranslations("Api.questions");

  const handleUpdate = useCallback(
    async (value: number | null) => {
      try {
        const res = await fetch(`/api/questions/${questionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maxScore: value,
            type: questionType,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ?? t("updateFailed"),
          );
        }

        toast.success(t("updateSuccess"));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("updateFailed");
        toast.error(message);
        throw error;
      }
    },
    [questionId, questionType, t],
  );

  return (
    <EditableNumberInput initialValue={initialValue} onUpdate={handleUpdate} />
  );
}
