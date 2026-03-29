"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Essay answer input — a resizable textarea.
 * The parent is responsible for persisting the answer on navigation.
 */
export function AnswerEssay({
  questionId,
  value,
  onChange,
}: {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("Pages.testStart");
  const id = `essay-${questionId}`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="sr-only">
        {t("essayPlaceholder")}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("essayPlaceholder")}
        className="min-h-[200px] resize-y text-sm leading-relaxed"
        aria-label={t("essayPlaceholder")}
      />
    </div>
  );
}
