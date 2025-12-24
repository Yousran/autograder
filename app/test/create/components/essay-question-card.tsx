"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionTextEditor } from "./question-text-editor";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TestFormValues } from "@/lib/validations/test";

type EssayQuestionCardProps = {
  index: number;
};

export function EssayQuestionCard({ index }: EssayQuestionCardProps) {
  const { register, watch, setValue } = useFormContext<TestFormValues>();

  const exactAnswer = watch(`questions.${index}.exactAnswer` as const);
  const questionText = watch(`questions.${index}.questionText` as const);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <QuestionTextEditor
          value={questionText || ""}
          onChange={(value) =>
            setValue(`questions.${index}.questionText` as const, value)
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Answer Key</Label>
        <Textarea
          {...register(`questions.${index}.answerText` as const)}
          placeholder="Enter the answer key for grading"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Settings</Label>
        <div className="flex gap-4">
          <div className="w-[50%] flex items-center justify-end gap-2">
            <Label htmlFor={`maxScore-${index}`}>Max Score</Label>
            <Input
              id={`maxScore-${index}`}
              type="number"
              min={1}
              {...register(`questions.${index}.maxScore` as const, {
                valueAsNumber: true,
              })}
              className="w-16"
            />
          </div>
          <div className="w-[50%] flex items-center justify-end gap-2">
            <Label htmlFor={`exact-answer-${index}`}>Exact Answer</Label>
            <Switch
              id={`exact-answer-${index}`}
              checked={exactAnswer}
              onCheckedChange={(checked) =>
                setValue(`questions.${index}.exactAnswer` as const, checked)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
