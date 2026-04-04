"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { useSync } from "../../context/sync-context";

export function ShowDetailedScoreToggle({
  testId,
  initialValue,
}: {
  testId: string;
  initialValue: boolean;
}) {
  const t = useTranslations();
  const [checked, setChecked] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const { setSaving, setSaved, setError } = useSync();

  async function handleCheckedChange(next: boolean) {
    if (isLoading) return;
    setChecked(next);
    setIsLoading(true);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShowDetailedScore: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          (data as { error?: string }).error ?? t("Api.tests.updateFailed");
        setError(errorMsg);
        setChecked(!next);
        return;
      }

      setSaved(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t("Api.tests.updateFailed"),
      );
      setChecked(!next);
    } finally {
      setIsLoading(false);
      setSaving(false);
    }
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleCheckedChange}
      data-testid="toggle-detailed-score"
    />
  );
}
