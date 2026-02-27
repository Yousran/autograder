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
import { QuestionType } from "@/lib/generated/prisma/enums";

interface Props {
  questionId: string;
  initialValue: number | null;
}

export function MaxScoreEditable({ questionId, initialValue }: Props) {
  const t = useTranslations("Api.questions");
  const [value, setValue] = useState<number | undefined>(
    initialValue ?? undefined,
  );
  const savedValue = useRef<number | null>(initialValue);

  async function save(val: number | undefined) {
    const next = val ?? null;
    if (next === savedValue.current) return;
    savedValue.current = next;

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxScore: next,
          type: QuestionType.ESSAY,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? t("updateFailed"));
        return;
      }

      toast.success(t("updateSuccess"));
    } catch {
      toast.error(t("updateFailed"));
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
