"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuestionEssayProps {
  answerText?: string;
  isExactAnswer?: boolean;
}

export function QuestionEssay({
  answerText = "",
  isExactAnswer = false,
}: QuestionEssayProps) {
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
      <Textarea
        id="answer"
        placeholder="Expected answer will appear here..."
        value={answerText}
        readOnly
        className="min-h-20"
      />
    </div>
  );
}
