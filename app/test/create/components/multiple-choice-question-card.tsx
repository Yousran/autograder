"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionTextEditor } from "./question-text-editor";
import type {
  MultipleChoiceQuestion,
  Question,
  MultipleChoice,
} from "@/types/question";
import { Trash2, Plus, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { Switch } from "@/components/ui/switch";

export function MultipleChoiceQuestionCard({
  question,
  questions,
  setQuestions,
}: {
  question: MultipleChoiceQuestion;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}) {
  useEffect(() => {
    if (!question.choices || question.choices.length === 0) {
      const defaultChoice = {
        id: crypto.randomUUID(),
        questionId: question.id,
        choiceText: "",
        isCorrect: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedQuestion: MultipleChoiceQuestion = {
        ...question,
        choices: [defaultChoice],
      };

      const updatedQuestions = questions.map((q) =>
        q.id === question.id ? updatedQuestion : q
      );
      setQuestions(updatedQuestions);
    }
  }, [question, questions, setQuestions]);

  const updateQuestion = (updatedQuestion: MultipleChoiceQuestion) => {
    const updatedQuestions = questions.map((q) =>
      q.id === question.id ? updatedQuestion : q
    );
    setQuestions(updatedQuestions);
  };

  const handleQuestionTextChange = (newText: string) => {
    updateQuestion({ ...question, questionText: newText });
  };

  const handleChoiceTextChange = (choiceId: string, newText: string) => {
    const updatedChoices = question.choices.map((choice) =>
      choice.id === choiceId ? { ...choice, choiceText: newText } : choice
    );
    updateQuestion({ ...question, choices: updatedChoices });
  };

  const handleChoiceCorrectToggle = (choiceId: string) => {
    const updatedChoices = question.choices.map((choice) =>
      choice.id === choiceId
        ? { ...choice, isCorrect: !choice.isCorrect }
        : choice
    );
    updateQuestion({ ...question, choices: updatedChoices });
  };

  const handleAddChoice = () => {
    const newChoice: MultipleChoice = {
      id: crypto.randomUUID(),
      questionId: question.id,
      choiceText: "",
      isCorrect: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateQuestion({ ...question, choices: [...question.choices, newChoice] });
  };

  const handleDeleteChoice = (choiceId: string) => {
    const updatedChoices = question.choices.filter(
      (choice) => choice.id !== choiceId
    );
    updateQuestion({ ...question, choices: updatedChoices });
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

  const handleisChoiceRandomizedChange = (val: boolean) => {
    const updatedQuestions = questions.map((q) => {
      if (q.id === question.id) {
        return { ...q, isChoiceRandomized: val };
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
        <Label>Choices</Label>

        <div className="flex flex-col gap-3">
          {question.choices?.map((choice, index) => (
            <div key={choice.id} className="flex items-center gap-2">
              <Button
                type="button"
                variant={choice.isCorrect ? "default" : "outline"}
                size="icon"
                onClick={() => handleChoiceCorrectToggle(choice.id)}
              >
                <CheckCircle2
                  className={`w-5 h-5 ${
                    choice.isCorrect
                      ? "text-primary-foreground"
                      : "text-primary"
                  }`}
                />
              </Button>
              <Input
                value={choice.choiceText}
                onChange={(e) =>
                  handleChoiceTextChange(choice.id, e.target.value)
                }
                placeholder={`Choice ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteChoice(choice.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={handleAddChoice} className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Choice
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Settings</Label>
        <div className="flex gap-4">
          <div className="w-[50%] flex items-center justify-end gap-2">
            <Label htmlFor="maxScore">Max Score</Label>
            <Input
              id="maxScore"
              type="number"
              min={0}
              value={question.maxScore || 5}
              onChange={(e) => handleMaxScoreChange(Number(e.target.value))}
              className="w-12"
            />
          </div>
          <div className="w-[50%] flex items-center justify-end gap-2">
            <Label htmlFor="randomized-choice">Randomized Choice</Label>
            <Switch
              id="randomized-choice"
              checked={question.isChoiceRandomized}
              onCheckedChange={handleisChoiceRandomizedChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
