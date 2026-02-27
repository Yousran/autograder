"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { EditableTextarea } from "@/components/custom/editable-textarea";
import { IsExactAnswerToggle } from "./is-exact-answer-toggle";
import { MaxScoreEditable } from "./max-score-editable";
import { QuestionType } from "@/lib/generated/prisma/enums";

interface QuestionEssayProps {
  questionId: string;
  answerText?: string;
  isExactAnswer?: boolean;
  maxScore?: number;
}

export function QuestionEssay({
  questionId,
  answerText = "",
  isExactAnswer = false,
  maxScore = 1,
}: QuestionEssayProps) {
  const t = useTranslations("Components.questionsTab");

  const handleUpdate = async (value: string) => {
    await fetch(`/api/questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answerText: value,
        type: QuestionType.ESSAY,
      }),
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="answer" className="text-sm font-medium">
          {t("essayAnswerLabel")}
        </Label>
        <EditableTextarea
          id="answer"
          placeholder={t("essayAnswerPlaceholder")}
          initialValue={answerText}
          onUpdate={handleUpdate}
          className="min-h-20"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label className="text-sm font-medium">
            {t("answerMatchingLabel")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {isExactAnswer
              ? t("answerMatchingExact")
              : t("answerMatchingPartial")}
          </p>
        </div>
        <IsExactAnswerToggle
          questionId={questionId}
          initialValue={isExactAnswer}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label className="text-sm font-medium">{t("maxScoreLabel")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("maxScoreDescription")}
          </p>
        </div>
        <MaxScoreEditable questionId={questionId} initialValue={maxScore} />
      </div>
    </div>
  );
}
