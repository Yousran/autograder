"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { CardQuestion } from "./card-question";
import { Question } from "@/types/question";
import { defaultQuestion } from "@/types/question";
import { useRef } from "react";

export function QuestionsBuilder({
  questions,
  setQuestions,
}: {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}) {
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const insertQuestion = (insertIndex: number) => {
    const newId = crypto.randomUUID();
    const newQuestion: Question = {
      ...defaultQuestion,
      id: newId,
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

    setTimeout(() => {
      const el = questionRefs.current[newId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div id="questions" className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <div
          key={question.id}
          ref={(e) => {
            questionRefs.current[question.id] = e;
          }}
          className="flex flex-col gap-4"
        >
          <CardQuestion
            question={question}
            questions={questions}
            setQuestions={setQuestions}
          />

          <Button
            className="w-full bg-secondary md:h-2 md:bg-secondary md:dark:bg-card md:hover:h-12 md:hover:bg-primary md:hover:dark:bg-primary border"
            onClick={() => insertQuestion(index + 1)}
          >
            <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
          </Button>
        </div>
      ))}
      {questions.length === 0 && (
        <Button
          className="w-full bg-secondary md:h-12 md:bg-secondary md:dark:bg-card md:hover:bg-primary md:hover:dark:bg-primary border"
          onClick={() => insertQuestion(0)}
        >
          <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
        </Button>
      )}
    </div>
  );
}
