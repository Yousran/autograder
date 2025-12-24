"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EssayQuestionCard } from "./essay-question-card";
import { ChoiceQuestionCard } from "./choice-question-card";
import { MultipleSelectQuestionCard } from "./multiple-select-question-card";
import { TestFormValues } from "@/lib/validations/test";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { Trash2 } from "lucide-react";

type CardQuestionProps = {
  index: number;
  onDelete: () => void;
};

export function CardQuestion({ index, onDelete }: CardQuestionProps) {
  const { watch, setValue, trigger } = useFormContext<TestFormValues>();
  const questionType = watch(`questions.${index}.type`);

  const handleTypeChange = (newType: QuestionType) => {
    // Reset question data based on type
    if (newType === QuestionType.ESSAY) {
      setValue(`questions.${index}`, {
        type: QuestionType.ESSAY,
        questionText: watch(`questions.${index}.questionText`) || "",
        order: index,
        exactAnswer: false,
        answerText: "",
        maxScore: 5,
      });
    } else if (newType === QuestionType.CHOICE) {
      setValue(`questions.${index}`, {
        type: QuestionType.CHOICE,
        questionText: watch(`questions.${index}.questionText`) || "",
        order: index,
        isChoiceRandomized: false,
        maxScore: 1,
        choices: [
          {
            choiceText: "",
            isCorrect: true,
          },
        ],
      });
    } else if (newType === QuestionType.MULTIPLE_SELECT) {
      setValue(`questions.${index}`, {
        type: QuestionType.MULTIPLE_SELECT,
        questionText: watch(`questions.${index}.questionText`) || "",
        order: index,
        isChoiceRandomized: false,
        maxScore: 4,
        choices: [
          {
            choiceText: "",
            isCorrect: true,
          },
        ],
      });
    }
    // Force re-render by triggering validation
    setTimeout(() => {
      trigger(`questions.${index}`);
    }, 0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Label className="text text-center font-bold text-2xl">
            {index + 1}
          </Label>
          <Select
            value={questionType}
            onValueChange={(val) => handleTypeChange(val as QuestionType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={QuestionType.ESSAY}>Essay</SelectItem>
              <SelectItem value={QuestionType.CHOICE}>Choice</SelectItem>
              <SelectItem value={QuestionType.MULTIPLE_SELECT}>
                Multiple Select
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={onDelete} type="button">
            <Trash2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {questionType === QuestionType.ESSAY && (
          <EssayQuestionCard index={index} />
        )}
        {questionType === QuestionType.CHOICE && (
          <ChoiceQuestionCard index={index} />
        )}
        {questionType === QuestionType.MULTIPLE_SELECT && (
          <MultipleSelectQuestionCard index={index} />
        )}
      </CardContent>
    </Card>
  );
}
