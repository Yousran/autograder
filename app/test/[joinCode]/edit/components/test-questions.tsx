"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, PlusIcon } from "lucide-react";
import { QuestionCard } from "./question-card";
import { useCallback, useEffect, useRef, useState } from "react";
import { Form } from "@/components/ui/form";
import { createQuestion } from "@/app/actions/question/create";
import { deleteQuestion } from "@/app/actions/question/delete";
import { getQuestionsByTestId } from "@/app/actions/question/get";
import {
  questionsSchema,
  transformPrismaToFormData,
  PrismaQuestionData,
  getDefaultQuestionFormData,
  QuestionValidation,
} from "@/types/question";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { toast } from "sonner";

export function TestQuestions({ testId }: { testId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const form = useForm({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      questions: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove, insert } = useFieldArray({
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
          console.error(result.error);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Create a new question with optimistic UI
  // When insertAtIndex is provided, inserts at that position; otherwise appends at the end
  const handleAddQuestion = useCallback(
    async (insertAtIndex?: number) => {
      // Prevent multiple simultaneous creates
      if (isCreating) return;

      // Determine target position: insert at specific index or append at end
      const targetIndex =
        insertAtIndex !== undefined ? insertAtIndex : fields.length;

      // 1) OPTIMISTIC: Immediately add a placeholder question to UI
      const optimisticData = getDefaultQuestionFormData(
        QuestionType.CHOICE,
        targetIndex
      );

      // Add with a temporary ID for tracking
      const tempId = `temp-${Date.now()}`;
      const optimisticQuestion = { ...optimisticData, id: tempId };

      if (insertAtIndex !== undefined) {
        // Insert at specific position and update orders for subsequent questions
        insert(insertAtIndex, optimisticQuestion as QuestionValidation);

        // Update orders for subsequent questions in the form state
        const currentQuestions = form.getValues("questions");
        for (let i = insertAtIndex + 1; i < currentQuestions.length; i++) {
          form.setValue(`questions.${i}.order`, i, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      } else {
        append(optimisticQuestion as QuestionValidation);
      }

      // Scroll to the new question immediately (optimistic feedback)
      setTimeout(() => {
        const el = questionRefs.current[targetIndex.toString()];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);

      // 2) SYNC: Create on server in background
      setIsCreating(true);

      try {
        const result = await createQuestion(testId, insertAtIndex);

        if (!result.success || !result.question) {
          // Rollback: Remove the optimistic item on failure
          remove(targetIndex);

          // Rollback orders for subsequent questions if we inserted
          if (insertAtIndex !== undefined) {
            const currentQuestions = form.getValues("questions");
            for (let i = insertAtIndex; i < currentQuestions.length; i++) {
              form.setValue(`questions.${i}.order`, i, {
                shouldValidate: false,
                shouldDirty: false,
              });
            }
          }

          toast.error(result.error || "Failed to create question");
          return;
        }

        // SUCCESS: Replace optimistic placeholder with real server data
        const created = transformPrismaToFormData(
          result.question as PrismaQuestionData
        );
        form.setValue(`questions.${targetIndex}`, created, {
          shouldValidate: false,
          shouldDirty: false,
        });
      } catch (error) {
        // Rollback on network error
        remove(targetIndex);

        // Rollback orders for subsequent questions if we inserted
        if (insertAtIndex !== undefined) {
          const currentQuestions = form.getValues("questions");
          for (let i = insertAtIndex; i < currentQuestions.length; i++) {
            form.setValue(`questions.${i}.order`, i, {
              shouldValidate: false,
              shouldDirty: false,
            });
          }
        }

        toast.error("Failed to create question");
        console.error(error);
      } finally {
        setIsCreating(false);
      }
    },
    [testId, append, insert, remove, fields.length, form, isCreating]
  );

  // Delete a question with optimistic UI and rollback on error
  const handleDeleteQuestion = useCallback(
    async (index: number) => {
      const current = form.getValues(`questions.${index}`);

      // OPTIMISTIC: Immediately remove from UI
      remove(index);

      // If not persisted yet (temp ID), nothing to sync
      if (!current.id || current.id.startsWith("temp-")) {
        return;
      }

      // SYNC: Delete on server in background
      try {
        const result = await deleteQuestion(current.id);
        if (!result.success) {
          // Rollback: Re-insert the question on failure
          insert(index, current as QuestionValidation);
          toast.error(result.error || "Failed to delete question");
        }
      } catch (error) {
        // Rollback on network error
        insert(index, current as QuestionValidation);
        toast.error("Failed to delete question");
        console.error(error);
      }
    },
    [insert, remove, form]
  );

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
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
                onClick={() => handleAddQuestion(index + 1)}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent animate-spin" />
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
              onClick={() => handleAddQuestion()}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-12 w-12 stroke-4 stroke-accent-foreground md:stroke-accent animate-spin" />
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
