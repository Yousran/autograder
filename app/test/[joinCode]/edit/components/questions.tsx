"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RawQuestion } from "@/types/question";
import { QuestionCard } from "./question-card";
import { getToken } from "@/lib/auth-client";

const Questions = ({ joinCode }: { joinCode: string }) => {
  const [questions, setQuestions] = useState<RawQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/v1/test/${joinCode}/questions`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await res.json();
        console.log("Fetched questions:", data);
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [joinCode]);
  return (
    <div className="flex flex-col gap-4">
      {!loading && questions ? (
        questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))
      ) : (
        <Skeleton className="h-32 w-full" />
      )}
    </div>
  );
};

export default Questions;
