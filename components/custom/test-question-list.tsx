"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export type Question = {
  id: number;
  question: string;
  isMarked: boolean;
};

type TestQuestionListProps = {
  questions: Question[];
  onSelectQuestion: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function TestQuestionList({
  questions,
  onSelectQuestion,
  open,
  onOpenChange,
}: TestQuestionListProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Question List</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-2">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="p-2 border rounded cursor-pointer hover:bg-gray-100 flex justify-between items-center"
              onClick={() => onSelectQuestion(index)}
            >
              <div>
                <p className="text-sm font-medium">Question {index + 1}</p>
                <p className="text-xs text-gray-600 truncate">{question.question}</p>
              </div>
              {question.isMarked && (
                <Button variant="secondary" size="sm">
                  Marked
                </Button>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
