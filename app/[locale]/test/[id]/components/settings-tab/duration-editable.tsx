"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditableNumberInput } from "@/components/custom/editable-number-input";
import { useSync } from "../../context/sync-context";

export function DurationEditable({
  testId,
  initialValue,
}: {
  testId: string;
  initialValue: number | null;
}) {
  const t = useTranslations();
  const { setSaving, setSaved, setError } = useSync();

  async function handleUpdate(value: number | null) {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testDuration: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          (data as { error?: string }).error ?? t("Api.tests.updateFailed");
        throw new Error(errorMsg);
      }

      setSaved(true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : t("Api.tests.updateFailed");
      toast.error(errorMsg);
      setError(errorMsg);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditableNumberInput
      initialValue={initialValue}
      onUpdate={handleUpdate}
      data-testid="input-duration"
    />
  );
}
