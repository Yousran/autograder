"use client";
import { createContext, useContext } from "react";
import { QuestionWithDetails } from "@/lib/schemas/question";

const QuestionsContext = createContext<
  | {
      questions: QuestionWithDetails[];
      updateQuestion: (
        id: string,
        newData: Partial<QuestionWithDetails>,
      ) => void;
    }
  | undefined
>(undefined);

export function QuestionsProvider({
  children,
  questions,
  setQuestions,
}: {
  children: React.ReactNode;
  questions: QuestionWithDetails[];
  setQuestions: React.Dispatch<React.SetStateAction<QuestionWithDetails[]>>;
}) {
  const updateQuestion = (
    id: string,
    newData: Partial<QuestionWithDetails>,
  ) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.id === id ? { ...q, ...newData } : q)),
    );
  };
  return (
    <QuestionsContext.Provider value={{ questions, updateQuestion }}>
      {children}
    </QuestionsContext.Provider>
  );
}

export const useQuestions = () => {
  const context = useContext(QuestionsContext);
  if (!context)
    throw new Error("useQuestions must be used within a QuestionsProvider");
  return context;
};
