"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { QuestionWithDetails } from "@/lib/schemas/question";
import { useQuestions } from "../../../context/question-context";

export function IsChoiceRandomizedToggle({
  question,
}: {
  question: QuestionWithDetails;
}) {
  const t = useTranslations();

  // Get current value based on question type
  const isChoice = question.type === QuestionType.CHOICE;
  const isMultipleSelect = question.type === QuestionType.MULTIPLE_SELECT;
  const currentValue = isChoice
    ? (question.choice?.isChoiceRandomized ?? false)
    : isMultipleSelect
      ? (question.multipleSelect?.isChoiceRandomized ?? false)
      : false;

  const [checked, setChecked] = useState(currentValue);
  const { updateQuestion } = useQuestions();

  async function handleCheckedChange(next: boolean) {
    // Snapshot: Save current state
    const previousData = currentValue;

    // Update Switch state first (immediate visual feedback)
    setChecked(next);

    // Then update local data
    if (isChoice) {
      updateQuestion(question.id, {
        choice: question.choice
          ? { ...question.choice, isChoiceRandomized: next }
          : undefined,
      });
    } else if (isMultipleSelect) {
      updateQuestion(question.id, {
        multipleSelect: question.multipleSelect
          ? { ...question.multipleSelect, isChoiceRandomized: next }
          : undefined,
      });
    }

    try {
      // Execution: Make API call
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isChoiceRandomized: next,
          type: question.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? t("Api.questions.updateFailed"),
        );
        // Reconciliation: Rollback on error
        setChecked(previousData);
        if (isChoice) {
          updateQuestion(question.id, {
            choice: question.choice
              ? { ...question.choice, isChoiceRandomized: previousData }
              : undefined,
          });
        } else if (isMultipleSelect) {
          updateQuestion(question.id, {
            multipleSelect: question.multipleSelect
              ? { ...question.multipleSelect, isChoiceRandomized: previousData }
              : undefined,
          });
        }
        return;
      }
      toast.success(t("Api.questions.updateSuccess"));
    } catch {
      toast.error(t("Api.questions.updateFailed"));
      // Reconciliation: Rollback on error
      setChecked(previousData);
      if (isChoice) {
        updateQuestion(question.id, {
          choice: question.choice
            ? { ...question.choice, isChoiceRandomized: previousData }
            : undefined,
        });
      } else if (isMultipleSelect) {
        updateQuestion(question.id, {
          multipleSelect: question.multipleSelect
            ? { ...question.multipleSelect, isChoiceRandomized: previousData }
            : undefined,
        });
      }
    }
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleCheckedChange}
      data-testid="toggle-choice-randomized"
    />
  );
}
