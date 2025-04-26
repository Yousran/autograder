// file: app/test/create/components/card-question.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChoiceQuestion,
  EssayQuestion,
  MultipleChoiceQuestion,
  Question,
  QuestionType,
} from "@/types/question";
import { EssayQuestionCard } from "./essay-question-card";
import { ChoiceQuestionCard } from "./choice-question-card";
import { MultipleChoiceQuestionCard } from "./multiple-choice-question-card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { devLog } from "@/utils/devLog";

export function CardQuestion({
  question,
  questions,
  setQuestions,
}: {
  question: Question;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    question.type as QuestionType
  );

  // Sync questionType with the current question type only if it changes
  useEffect(() => {
    if (question.type !== questionType) {
      const updatedQuestions = questions.map((q) => {
        if (q.id === question.id) {
          const base = {
            id: q.id,
            order: q.order,
            type: questionType,
            questionText: q.questionText,
            testId: q.testId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          if (questionType === QuestionType.ESSAY) {
            return {
              ...base,
              answerText: "",
              isExactAnswer: false,
              maxScore: 5,
            } as EssayQuestion;
          }

          if (questionType === QuestionType.CHOICE) {
            return {
              ...base,
              choices: [
                {
                  id: crypto.randomUUID(),
                  questionId: question.id,
                  choiceText: "",
                  isCorrect: true,
                },
              ],
              isChoiceRandomized: true,
              maxScore: 1,
            } as ChoiceQuestion;
          }

          if (questionType === QuestionType.MULTIPLE_CHOICE) {
            return {
              ...base,
              choices: [
                {
                  id: crypto.randomUUID(),
                  questionId: question.id,
                  choiceText: "",
                  isCorrect: true,
                },
              ],
              isChoiceRandomized: true,
              maxScore: 4,
            };
          }

          return q;
        }
        return q;
      });

      setQuestions(updatedQuestions);
    }
  }, [questionType, question.id, questions, setQuestions, question.type]);

  const handleDeleteQuestion = () => {
    const filtered = questions.filter((q) => q.id !== question.id);
    const reOrdered = filtered.map((q, idx) => ({
      ...q,
      order: idx + 1,
    }));
    devLog("Filtered questions", reOrdered);
    setQuestions(reOrdered);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Label className="text text-center font-bold text-2xl">
            {question.order}
          </Label>
          <Select
            value={questionType}
            onValueChange={(val) => setQuestionType(val as QuestionType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={QuestionType.ESSAY}>Essay</SelectItem>
              <SelectItem value={QuestionType.CHOICE}>Choice</SelectItem>
              <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                Multiple Choice
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={handleDeleteQuestion}>
            <Trash2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {questionType === QuestionType.ESSAY && (
          <EssayQuestionCard
            question={question as EssayQuestion}
            questions={questions}
            setQuestions={setQuestions}
          />
        )}
        {questionType === QuestionType.CHOICE && (
          <ChoiceQuestionCard
            question={question as ChoiceQuestion}
            questions={questions}
            setQuestions={setQuestions}
          />
        )}
        {questionType === QuestionType.MULTIPLE_CHOICE && (
          <MultipleChoiceQuestionCard
            question={question as MultipleChoiceQuestion}
            questions={questions}
            setQuestions={setQuestions}
          />
        )}
      </CardContent>
    </Card>
  );
}
