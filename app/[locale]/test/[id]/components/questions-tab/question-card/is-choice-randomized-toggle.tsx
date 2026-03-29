"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { QuestionType } from "@/lib/generated/prisma/enums";

interface Props {
  questionId: string;
  initialValue: boolean;
  questionType: QuestionType;
}

export function IsChoiceRandomizedToggle({
  questionId,
  initialValue,
  questionType,
}: Props) {
  const t = useTranslations("Api.questions");
  const [checked, setChecked] = useState(initialValue);

  async function handleCheckedChange(next: boolean) {
    setChecked(next);

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isChoiceRandomized: next,
          type: questionType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? t("updateFailed"));
        setChecked(!next);
        return;
      }

      toast.success(t("updateSuccess"));
    } catch {
      toast.error(t("updateFailed"));
      setChecked(!next);
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
