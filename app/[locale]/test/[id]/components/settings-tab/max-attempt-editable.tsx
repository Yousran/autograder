"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EditableNumberInput } from "@/components/custom/editable-number-input";

interface Props {
  testId: string;
  initialValue: number | null;
}

export function MaxAttemptEditable({ testId, initialValue }: Props) {
  const tApiTests = useTranslations("Api.tests");

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
          (data as { error?: string }).error ?? tApiTests("updateFailed"),
        );
      }

      toast.success(tApiTests("updateSuccess"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tApiTests("updateFailed");
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
