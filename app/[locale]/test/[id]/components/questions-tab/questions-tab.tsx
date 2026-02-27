"use client";

import { useState, useEffect, Fragment } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sortable } from "@/components/reui/sortable";
import { QuestionCard } from "./question-card/question-card";
import { QuestionsSkeleton } from "./questions-skeleton";
import { AddDivider } from "./add-divider";
import { QuestionSchema, defaultQuestionData } from "@/lib/schemas/question";
import { QuestionType } from "@/lib/generated/prisma/browser";

interface QuestionsTabProps {
  testId: string;
}

export function QuestionsTab({ testId }: QuestionsTabProps) {
  const t = useTranslations("Components.questionsTab");
  const [questions, setQuestions] = useState<QuestionSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/questions?testid=${testId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data?.error ?? t("fetchFailed"));
          return;
        }
        const data: QuestionSchema[] = await res.json();
        if (!cancelled) setQuestions(data);
      } catch {
        if (!cancelled) toast.error(t("fetchFailed"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [testId, t]);

  async function handleDelete(id: string): Promise<void> {
    const previous = questions;
    setQuestions((prev) => prev.filter((q) => q.id !== id));

    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" }).catch(
      () => null,
    );

    if (!res || !res.ok) {
      setQuestions(previous);
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? t("deleteFailed"));
    }
  }

  // afterId: string  → insert after that question
  // afterId: null    → insert at beginning
  // afterId: undefined (omitted) → append at end
  async function handleReorder(newQuestions: QuestionSchema[]): Promise<void> {
    // Drag-and-drop moves exactly one item at a time — find it.
    const movedItem = newQuestions.find((q, newIdx) => {
      const prevIdx = questions.findIndex((prev) => prev.id === q.id);
      return prevIdx !== newIdx;
    });

    if (!movedItem) return;

    // Optimistic update
    const previous = questions;
    setQuestions(newQuestions);

    const newIdx = newQuestions.findIndex((q) => q.id === movedItem.id);
    // Send the order of the item being displaced (now sits after the drop),
    // or null if the question was moved to the very end.
    const afterItem =
      newIdx < newQuestions.length - 1 ? newQuestions[newIdx + 1] : null;

    const res = await fetch(`/api/questions/${movedItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: afterItem?.order ?? null }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setQuestions(previous);
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? t("reorderFailed"));
      return;
    }

    // Update the moved item's order from the server's authoritative response.
    const updated: { order: string } = await res.json();
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === movedItem.id ? { ...q, order: updated.order } : q,
      ),
    );
  }

  async function handleCreate(afterId?: string | null): Promise<void> {
    const tempItem: QuestionSchema = {
      id: defaultQuestionData.id,
      testId,
      type: defaultQuestionData.type,
      questionText: defaultQuestionData.questionText,
      order: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistic insert
    setQuestions((prev) => {
      if (afterId === undefined) {
        return [...prev, tempItem];
      }
      if (afterId === null) {
        return [tempItem, ...prev];
      }
      const idx = prev.findIndex((q) => q.id === afterId);
      if (idx === -1) return [...prev, tempItem];
      const next = [...prev];
      next.splice(idx + 1, 0, tempItem);
      return next;
    });
    const res = await fetch("/api/questions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testId,
        insertAfterId: afterId,
      }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== tempItem.id));
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? t("createFailed"));
      return;
    }

    const question: QuestionSchema = await res.json();
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === tempItem.id
          ? {
              id: question.id,
              testId: question.testId,
              type: question.type,
              questionText: question.questionText,
              order: question.order,
              createdAt: question.createdAt,
              updatedAt: question.updatedAt,
            }
          : q,
      ),
    );
  }

  async function handleTypeChange(
    id: string,
    type: QuestionType,
  ): Promise<void> {
    // Optimistic update
    const previous = questions;
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, type } : q)));

    const res = await fetch(`/api/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setQuestions(previous);
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? t("typeChangeFailed"));
      return;
    }
  }

  if (isLoading) {
    return <QuestionsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Sortable
        value={questions}
        onValueChange={handleReorder}
        getItemValue={(item) => item.id}
        strategy="vertical"
        className="flex flex-col"
      >
        {questions.map((question, index) => (
          <Fragment key={question.id}>
            <QuestionCard
              question={question}
              index={index}
              onDelete={handleDelete}
              onTypeChange={(type) => handleTypeChange(question.id, type)}
            />
            {index < questions.length - 1 && (
              <AddDivider onClick={() => handleCreate(question.id)} />
            )}
          </Fragment>
        ))}
      </Sortable>
      <AddDivider onClick={() => handleCreate()} alwaysVisible />
    </div>
  );
}
