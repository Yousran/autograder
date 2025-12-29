"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Loader2, PlusIcon } from "lucide-react";
import { QuestionCard } from "./question-card";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { createQuestion } from "@/app/actions/question/create";
import { deleteQuestion } from "@/app/actions/question/delete";
import { getQuestionsByTestId } from "@/app/actions/question/get";
import {
  questionsFormSchema,
  transformPrismaToFormData,
  PrismaQuestionData,
} from "@/types/question-form";

export function TestQuestions({ testId }: { testId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, startCreateTransition] = useTransition();
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const form = useForm({
    resolver: zodResolver(questionsFormSchema),
    defaultValues: {
      questions: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Fetch existing questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const result = await getQuestionsByTestId(testId);
        if (result.success && result.questions) {
          const formData = result.questions.map((q) =>
            transformPrismaToFormData(q as PrismaQuestionData)
          );
          form.reset({ questions: formData });
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error("Failed to load questions");
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Create a new question in the database and add to form
  const handleAddQuestion = useCallback(() => {
    startCreateTransition(async () => {
      const result = await createQuestion(testId);

      if (!result.success || !result.question) {
        toast.error(result.error || "Failed to create question");
        return;
      }

      // Transform the created question to form data
      const formData = transformPrismaToFormData(
        result.question as PrismaQuestionData
      );
      append(formData);

      // Scroll to the new question
      setTimeout(() => {
        const newIndex = fields.length;
        const el = questionRefs.current[newIndex.toString()];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

      toast.success("Question created");
    });
  }, [testId, append, fields.length]);

  // Delete a question from the database and remove from form
  const handleDeleteQuestion = useCallback(
    async (index: number) => {
      const question = form.getValues(`questions.${index}`);

      if (!question.id) {
        // Question doesn't exist in DB yet, just remove from form
        remove(index);
        return;
      }

      const result = await deleteQuestion(question.id);

      if (!result.success) {
        toast.error(result.error || "Failed to delete question");
        return;
      }

      remove(index);
      toast.success("Question deleted");
    },
    [form, remove]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4">
        <div id="questions" className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              ref={(e) => {
                questionRefs.current[index.toString()] = e;
              }}
              className="flex flex-col gap-4"
            >
              <QuestionCard
                index={index}
                onDelete={() => handleDeleteQuestion(index)}
              />

              <Button
                type="button"
                className="w-full bg-secondary md:h-2 md:bg-secondary md:dark:bg-card md:hover:h-12 md:hover:bg-primary md:hover:dark:bg-primary border"
                onClick={handleAddQuestion}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
                )}
              </Button>
            </div>
          ))}
          {fields.length === 0 && (
            <Button
              type="button"
              className="w-full bg-secondary md:h-12 md:bg-secondary md:dark:bg-card md:hover:bg-primary md:hover:dark:bg-primary border"
              onClick={handleAddQuestion}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <PlusIcon className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent" />
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
