"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { CardQuestion } from "./card-question";
import { Question } from "@/types/question";

export function QuestionsBuilder({
  questions,
  setQuestions,
}: {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}) {
  const insertQuestion = (insertIndex: number) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      testId: "",
      type: "ESSAY",
      questionText: "",
      order: insertIndex + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedQuestions = [...questions];
    updatedQuestions.splice(insertIndex, 0, newQuestion);

    updatedQuestions.forEach((q, index) => {
      q.order = index + 1;
    });

    setQuestions(updatedQuestions);
  };

  return (
    <div id="questions" className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <div key={question.id} className="flex flex-col gap-4">
          <CardQuestion
            question={question}
            questions={questions}
            setQuestions={setQuestions}
          />

          <Button
            className="w-full bg-secondary md:h-2 md:bg-secondary md:dark:bg-card md:hover:h-12 md:hover:bg-primary md:hover:dark:bg-primary "
            onClick={() => insertQuestion(index + 1)}
          >
            <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
          </Button>
        </div>
      ))}
    </div>
  );
}
