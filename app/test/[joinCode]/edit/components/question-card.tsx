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
import { QuestionType } from "@/lib/generated/prisma/enums";
import { Loader2, Trash2 } from "lucide-react";
import { EssayQuestionCard } from "./essay-question-card";
import { ChoiceQuestionCard } from "./choice-question-card";
import { MultipleSelectQuestionCard } from "./multiple-select-question-card";
import { QuestionsFormData, QuestionFormData } from "@/types/question-form";
import { editQuestion } from "@/app/actions/question/edit";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type QuestionCardProps = {
  index: number;
  onDelete: () => void;
};

export function QuestionCard({ index, onDelete }: QuestionCardProps) {
  const { watch, setValue, getValues } = useFormContext<QuestionsFormData>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingType, setIsChangingType] = useState(false);

  const questionId = watch(`questions.${index}.id`);
  const questionType = watch(`questions.${index}.type`);

  const handleTypeChange = useCallback(
    async (newType: QuestionType) => {
      if (newType === questionType || isChangingType) return;

      setIsChangingType(true);
      const currentQuestion = getValues(`questions.${index}`);

      // Create updated question with proper typing
      let updatedQuestion: QuestionFormData;

      if (newType === QuestionType.ESSAY) {
        updatedQuestion = {
          type: QuestionType.ESSAY,
          questionText: currentQuestion.questionText,
          order: currentQuestion.order,
          maxScore: currentQuestion.maxScore,
          answerText: "Enter your answer key here...",
          isExactAnswer: false,
          ...(currentQuestion.id && { id: currentQuestion.id }),
        };
      } else if (newType === QuestionType.CHOICE) {
        updatedQuestion = {
          type: QuestionType.CHOICE,
          questionText: currentQuestion.questionText,
          order: currentQuestion.order,
          maxScore: currentQuestion.maxScore,
          isChoiceRandomized: false,
          choices: [
            { choiceText: "Option 1", isCorrect: true },
            { choiceText: "Option 2", isCorrect: false },
          ],
          ...(currentQuestion.id && { id: currentQuestion.id }),
        };
      } else {
        updatedQuestion = {
          type: QuestionType.MULTIPLE_SELECT,
          questionText: currentQuestion.questionText,
          order: currentQuestion.order,
          maxScore: currentQuestion.maxScore,
          isChoiceRandomized: false,
          choices: [
            { choiceText: "Option 1", isCorrect: true },
            { choiceText: "Option 2", isCorrect: false },
          ],
          ...(currentQuestion.id && { id: currentQuestion.id }),
        };
      }

      // Update local form state first for responsive UI
      setValue(`questions.${index}`, updatedQuestion, {
        shouldValidate: false,
      });

      // Sync to database if question exists
      if (currentQuestion.id) {
        try {
          const result = await editQuestion(
            currentQuestion.id,
            updatedQuestion
          );
          if (!result.success) {
            // Revert on failure
            setValue(`questions.${index}`, currentQuestion);
            console.error(result.error);
          } else {
            console.log("Question type changed");
          }
        } catch {
          setValue(`questions.${index}`, currentQuestion);
          console.error("Failed to change question type");
        }
      }

      setIsChangingType(false);
    },
    [questionType, getValues, setValue, index, isChangingType]
  );

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  }, [onDelete]);

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
            disabled={isChangingType}
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
          <Button
            variant="destructive"
            onClick={handleDelete}
            type="button"
            disabled={isDeleting || isChangingType}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isChangingType ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {questionType === QuestionType.ESSAY && (
              <EssayQuestionCard index={index} questionId={questionId} />
            )}
            {questionType === QuestionType.CHOICE && (
              <ChoiceQuestionCard index={index} questionId={questionId} />
            )}
            {questionType === QuestionType.MULTIPLE_SELECT && (
              <MultipleSelectQuestionCard
                index={index}
                questionId={questionId}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
