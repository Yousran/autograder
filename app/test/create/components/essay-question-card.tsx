"use client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionTextEditor } from "./question-text-editor";
import type { EssayQuestion, Question } from "@/types/question";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function EssayQuestionCard({
  question,
  questions,
  setQuestions,
}: {
  question: EssayQuestion;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}) {
  const handleQuestionTextChange = (newText: string) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === question.id) {
        return { ...q, questionText: newText };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleAnswerChange = (newAnswer: string) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === question.id) {
        return { ...q, answerText: newAnswer };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleMaxScoreChange = (newScore: number) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === question.id) {
        return { ...q, maxScore: newScore };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleExactAnswerChange = (val: boolean) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === question.id) {
        return { ...q, isExactAnswer: val };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <QuestionTextEditor
          value={question.questionText}
          onChange={handleQuestionTextChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Answer</Label>
        <Textarea
          value={question.answerText}
          onChange={(e) => handleAnswerChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Settings</Label>
        <div className="flex gap-4">
          <div className="w-[50%] flex items-center justify-end gap-2">
            <Label htmlFor="maxScore">Max Score</Label>
            <Input
              id="maxScore"
              type="number"
              min={1}
              value={question.maxScore}
              onChange={(e) => handleMaxScoreChange(Number(e.target.value))}
              className="w-16"
            />
          </div>
          <div className="w-[50%] flex items-center justify-end gap-2">
            <Label htmlFor="exact-answer">Exact Answer</Label>
            <Switch
              id="exact-answer"
              checked={question.isExactAnswer}
              onCheckedChange={handleExactAnswerChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
