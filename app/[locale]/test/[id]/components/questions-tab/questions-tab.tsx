"use client";

import { useState } from "react";
import { Sortable } from "@/components/reui/sortable";
import { QuestionCard, type QuestionItem } from "./question-card";

const initialQuestions: QuestionItem[] = [
  { id: "question-1", title: "Question 1" },
  { id: "question-2", title: "Question 2" },
];

export function QuestionsTab() {
  const [questions, setQuestions] = useState(initialQuestions);

  return (
    <Sortable
      value={questions}
      onValueChange={setQuestions}
      getItemValue={(item) => item.id}
      strategy="vertical"
      className="flex flex-col gap-4"
    >
      {questions.map((question, index) => (
        <QuestionCard key={question.id} question={question} index={index} />
      ))}
    </Sortable>
  );
}
