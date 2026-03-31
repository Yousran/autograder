"use client";

import { useState, useEffect, Fragment } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sortable } from "@/components/reui/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { QuestionCard } from "./question-card/question-card";
import { QuestionsSkeleton } from "@/components/custom/skeletons/questions-skeleton";
import { AddDivider } from "./add-divider";
import {
  QuestionWithDetails,
  defaultQuestionData,
} from "@/lib/schemas/question";
import { QuestionType } from "@/lib/generated/prisma/browser";

export function QuestionsTab({ testId }: { testId: string }) {
  const t = useTranslations("Components.questionsTab");
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
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
        const data: QuestionWithDetails[] = await res.json();
        if (!cancelled) {
          setQuestions(data);
        }
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

  async function handleReorder(
    activeIndex: number,
    overIndex: number,
  ): Promise<void> {
    if (activeIndex === overIndex) return;

    // The item the user actually dragged — identified directly from dnd-kit indices.
    const draggedItem = questions[activeIndex];
    if (!draggedItem) return;

    const newQuestions = arrayMove(questions, activeIndex, overIndex);
    const previous = questions;

    // 1. Optimistic: update visual order immediately
    setQuestions(newQuestions);

    const newIdx = overIndex;
    const beforeId = newIdx > 0 ? newQuestions[newIdx - 1].id : null;
    const afterId =
      newIdx < newQuestions.length - 1 ? newQuestions[newIdx + 1].id : null;

    const res = await fetch(`/api/questions/${draggedItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beforeId, afterId }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setQuestions(previous); // rollback
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? t("reorderFailed"));
      return;
    }
  }

  async function handleCreate(afterId?: string | null): Promise<void> {
    // Generate a unique temp ID per call so concurrent creates don't collide.
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempItem: QuestionWithDetails = {
      id: tempId,
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
      setQuestions((prev) => prev.filter((q) => q.id !== tempId));
      const data = await res?.json().catch(() => ({}));
      toast.error(data?.error ?? t("createFailed"));
      return;
    }

    const question: QuestionWithDetails = await res.json();
    setQuestions((prev) => prev.map((q) => (q.id === tempId ? question : q)));
  }

  async function handleTypeChange(
    id: string,
    type: QuestionType,
  ): Promise<void> {
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
    // Replace the local question with the server's authoritative response
    // which includes related type-specific data (choices/essay/multipleSelect).
    try {
      const updated = await res.json();
      setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
    } catch (err) {
      // If parsing fails, silently ignore — optimistic update already applied.
      console.error("Failed to parse updated question response:", err);
    }
    toast.success("Question type updated");
  }

  if (isLoading) {
    return <QuestionsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Sortable
        value={questions}
        onValueChange={() => {}}
        onMove={({ activeIndex, overIndex }) =>
          handleReorder(activeIndex, overIndex)
        }
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
