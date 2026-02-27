"use client";

import { Label } from "@/components/ui/label";
import { EditableTextarea } from "@/components/custom/editable-textarea";
import { QuestionType } from "@/lib/generated/prisma/enums";

interface QuestionEssayProps {
  questionId: string;
  answerText?: string;
  isExactAnswer?: boolean;
}

export function QuestionEssay({
  questionId,
  answerText = "",
  isExactAnswer = false,
}: QuestionEssayProps) {
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
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="answer" className="text-sm font-medium">
          Expected Answer
        </Label>
        <span className="text-xs text-muted-foreground">
          {isExactAnswer ? "Exact Match" : "Partial Match"}
        </span>
      </div>
      <EditableTextarea
        id="answer"
        placeholder="Expected answer will appear here..."
        initialValue={answerText}
        onUpdate={handleUpdate}
        className="min-h-20"
      />
    </div>
  );
}
