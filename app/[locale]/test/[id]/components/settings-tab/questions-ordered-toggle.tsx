"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function QuestionsOrderedToggle({
  testId,
  initialValue,
}: {
  testId: string;
  initialValue: boolean;
}) {
  const t = useTranslations();
  const [checked, setChecked] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckedChange(next: boolean) {
    if (isLoading) return;
    setChecked(next);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isQuestionsOrdered: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? t("Api.tests.updateFailed"),
        );
        setChecked(!next);
        return;
      }

      toast.success(t("Api.tests.updateSuccess"));
    } catch {
      toast.error(t("Api.tests.updateFailed"));
      setChecked(!next);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleCheckedChange}
      data-testid="toggle-questions-ordered"
    />
  );
}
