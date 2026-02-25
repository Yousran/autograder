"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

interface Props {
  testId: string;
  initialValue: number | null;
}

export function MaxAttemptEditable({ testId, initialValue }: Props) {
  const tTests = useTranslations("Tests");
  const [value, setValue] = useState<number | undefined>(
    initialValue ?? undefined,
  );
  const savedValue = useRef<number | null>(initialValue);

  async function save(val: number | undefined) {
    const next = val ?? null;
    if (next === savedValue.current) return;
    savedValue.current = next;

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxAttempts: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? tTests("updateFailed"),
        );
        return;
      }

      toast.success(tTests("updateSuccess"));
    } catch {
      toast.error(tTests("updateFailed"));
    }
  }

  return (
    <div
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          save(value);
        }
      }}
    >
      <NumberField
        value={value}
        onValueChange={(v) => setValue(v ?? undefined)}
        min={1}
        step={1}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </div>
  );
}
