"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditableNumberInput } from "@/components/custom/editable-number-input";

export function MaxAttemptEditable({
  testId,
  initialValue,
}: {
  testId: string;
  initialValue: number | null;
}) {
  const t = useTranslations();

  async function handleUpdate(value: number | null) {
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxAttempts: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? t("Api.tests.updateFailed"),
        );
      }

      toast.success(t("Api.tests.updateSuccess"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Api.tests.updateFailed");
      toast.error(message);
      throw error;
    }
  }

  return (
    <EditableNumberInput
      initialValue={initialValue}
      onUpdate={handleUpdate}
      data-testid="input-max-attempts"
    />
  );
}
