"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { CardQuestion } from "./card-question";
import { TestFormValues } from "@/lib/validations/test";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { useRef } from "react";

export function QuestionsBuilder() {
  const { control } = useFormContext<TestFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const insertQuestion = (insertIndex: number) => {
    const newQuestion = {
      type: QuestionType.ESSAY,
      questionText: "",
      order: insertIndex,
      exactAnswer: false,
      answerText: "",
      maxScore: 5,
    };

    append(newQuestion);

    // Scroll to new question
    setTimeout(() => {
      const el = questionRefs.current[fields.length.toString()];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div id="questions" className="flex flex-col gap-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          ref={(e) => {
            questionRefs.current[index.toString()] = e;
          }}
          className="flex flex-col gap-4"
        >
          <CardQuestion index={index} onDelete={() => remove(index)} />

          <Button
            type="button"
            className="w-full bg-secondary md:h-2 md:bg-secondary md:dark:bg-card md:hover:h-12 md:hover:bg-primary md:hover:dark:bg-primary border"
            onClick={() => insertQuestion(index + 1)}
          >
            <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
          </Button>
        </div>
      ))}
      {fields.length === 0 && (
        <Button
          type="button"
          className="w-full bg-secondary md:h-12 md:bg-secondary md:dark:bg-card md:hover:bg-primary md:hover:dark:bg-primary border"
          onClick={() => insertQuestion(0)}
        >
          <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
        </Button>
      )}
    </div>
  );
}
