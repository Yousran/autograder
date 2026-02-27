"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditableNumberInput } from "@/components/custom/editable-number-input";
import { QuestionType } from "@/lib/generated/prisma/enums";

interface Props {
  questionId: string;
  initialValue: number | null;
}

export function MaxScoreEditable({ questionId, initialValue }: Props) {
  const t = useTranslations("Api.questions");

  async function handleUpdate(value: number | null) {
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxScore: value,
          type: QuestionType.ESSAY,
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
  }

  return (
    <EditableNumberInput initialValue={initialValue} onUpdate={handleUpdate} />
  );
}
