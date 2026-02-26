"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Sortable } from "@/components/reui/sortable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { QuestionCard, type QuestionItem } from "./question-card";

interface QuestionsTabProps {
  testId: string;
}

export function QuestionsTab({ testId }: QuestionsTabProps) {
  const t = useTranslations("Components.questionsTab");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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

  function handleDelete(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function handleCreate() {
    startTransition(async () => {
      const res = await fetch("/api/questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? t("createFailed"));
        return;
      }

      const question = await res.json();
      setQuestions((prev) => [
        ...prev,
        {
          id: question.id,
          type: question.type,
          questionText: question.questionText,
        },
      ]);
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Sortable
        value={questions}
        onValueChange={setQuestions}
        getItemValue={(item) => item.id}
        strategy="vertical"
        className="flex flex-col gap-4"
      >
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            onDelete={handleDelete}
          />
        ))}
      </Sortable>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleCreate}
        disabled={isPending}
      >
        <PlusIcon />
        {isPending ? t("creating") : t("addQuestion")}
      </Button>
    </div>
  );
}
