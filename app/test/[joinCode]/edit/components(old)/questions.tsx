"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "./question-card";
import { getQuestionsByTestId } from "@/app/actions/get-questions";
import { Question } from "@/types/question";

const Questions = ({ testId }: { testId: string }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!testId) {
        if (mounted) {
          setError("Missing testId");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await getQuestionsByTestId(testId);
        if (res && "success" in res && res.success) {
          if (mounted) setQuestions(res.questions);
        } else {
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load questions");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [testId]);

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!questions || questions.length === 0)
    return <div className="text-muted-foreground">No questions yet</div>;

  return (
    <div className="flex flex-col gap-4">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
};

export default Questions;
