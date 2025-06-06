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
import { QuestionWithAnswers } from "../participant-response";
import { truncateText } from "@/lib/text";

export default function QuestionList({
  questions,
  question,
  handleNavigation,
  isMarked,
  open,
  setOpen,
}: {
  questions: QuestionWithAnswers[];
  question: QuestionWithAnswers;
  handleNavigation: (index: number) => void;
  isMarked: boolean[];
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Question List</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full ">
          <div className="flex flex-col gap-2 p-4">
            {questions.map((q, index) => (
              <Button
                key={index}
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
                {index + 1}{" "}
                {truncateText(
                  q.type === "ESSAY" && q.essay?.answer.answerText
                    ? q.essay.answer.answerText
                    : q.type === "CHOICE"
                    ? q.choice?.choices.find(
                        (choice) =>
                          choice.id === q.choice?.answer.selectedChoiceId
                      )?.choiceText || ""
                    : q.type === "MULTIPLE_SELECT"
                    ? q.multipleSelect?.answer.selectedChoices
                        .map((selectedChoice) => selectedChoice.choiceText)
                        .join(", ") || ""
                    : ""
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
      <SheetDescription></SheetDescription>
    </Sheet>
  );
}
