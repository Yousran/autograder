"use client";

import { useState, useEffect, Fragment } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sortable } from "@/components/reui/sortable";
import { QuestionCard, type QuestionItem } from "./question-card";
import { QuestionsSkeleton } from "./questions-skeleton";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { AddDivider } from "./add-divider";

interface QuestionsTabProps {
  testId: string;
}

export function QuestionsTab({ testId }: QuestionsTabProps) {
  const t = useTranslations("Components.questionsTab");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
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
        const data: QuestionItem[] = await res.json();
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
  async function handleCreate(afterId?: string | null): Promise<void> {
    const tempId = `temp-${Date.now()}`;
    const tempItem: QuestionItem = {
      id: tempId,
      type: QuestionType.CHOICE,
      questionText: "",
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
      setQuestions((prev) => prev.filter((q) => q.id !== tempId));
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? t("createFailed"));
      return;
    }

    const question = await res.json();
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === tempId
          ? {
              id: question.id,
              type: question.type,
              questionText: question.questionText,
            }
          : q,
      ),
    );
  }

  if (isLoading) {
    return <QuestionsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Sortable
        value={questions}
        onValueChange={setQuestions}
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
