"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateText } from "@/lib/text";
import type { QuestionWithAnswer } from "@/types/participant-test";

interface QuestionListProps {
  questions: QuestionWithAnswer[];
  question: QuestionWithAnswer;
  handleNavigation: (index: number) => void;
  isMarked: boolean[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function QuestionList({
  questions,
  question,
  handleNavigation,
  isMarked,
  open,
  setOpen,
}: QuestionListProps) {
  const getAnswerPreview = (q: QuestionWithAnswer): string => {
    if (q.type === "ESSAY" && q.essay?.answer.answerText) {
      return q.essay.answer.answerText;
    }
    if (q.type === "CHOICE" && q.choice) {
      const selectedChoice = q.choice.choices.find(
        (choice) => choice.id === q.choice?.answer.selectedChoiceId
      );
      return selectedChoice?.choiceText || "";
    }
    if (q.type === "MULTIPLE_SELECT" && q.multipleSelect) {
      return (
        q.multipleSelect.answer.selectedChoices
          .map((sc) => sc.choiceText)
          .join(", ") || ""
      );
    }
    return "";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Question List</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-2 p-4">
            {questions.map((q, index) => (
              <Button
                key={q.id}
                variant={
                  question.id === q.id
                    ? isMarked[index]
                      ? "warning_outline"
                      : "default"
                    : isMarked[index]
                    ? "warning"
                    : "outline"
                }
                onClick={() => handleNavigation(index)}
              >
                {index + 1} {truncateText(getAnswerPreview(q))}
              </Button>
            ))}
          </div>
        </ScrollArea>
        <SheetDescription></SheetDescription>
      </SheetContent>
    </Sheet>
  );
}
