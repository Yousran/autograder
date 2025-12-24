"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionTextEditor } from "./question-text-editor";
import { Switch } from "@/components/ui/switch";
import { TestFormValues } from "@/lib/validations/test";
import { Trash2, Plus, CheckCircle2 } from "lucide-react";

type MultipleSelectQuestionCardProps = {
  index: number;
};

export function MultipleSelectQuestionCard({
  index,
}: MultipleSelectQuestionCardProps) {
  const { register, watch, setValue, control } =
    useFormContext<TestFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${index}.choices` as const,
  });

  const questionText = watch(`questions.${index}.questionText` as const);
  const isChoiceRandomized = watch(
    `questions.${index}.isChoiceRandomized` as const
  );

  const handleAddChoice = () => {
    append({
      choiceText: "",
      isCorrect: false,
    });
  };

  const handleChoiceCorrectToggle = (choiceIndex: number) => {
    const currentValue = watch(
      `questions.${index}.choices.${choiceIndex}.isCorrect` as const
    );
    setValue(
      `questions.${index}.choices.${choiceIndex}.isCorrect` as const,
      !currentValue
    );
  };

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
        <Label>Choices</Label>

        <div className="flex flex-col gap-3">
          {fields.map((field, choiceIndex) => {
            const isCorrect = watch(
              `questions.${index}.choices.${choiceIndex}.isCorrect` as const
            );

            return (
              <div key={field.id} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isCorrect ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleChoiceCorrectToggle(choiceIndex)}
                >
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      isCorrect ? "text-primary-foreground" : "text-primary"
                    }`}
                  />
                </Button>
                <Input
                  {...register(
                    `questions.${index}.choices.${choiceIndex}.choiceText` as const
                  )}
                  placeholder={`Choice ${choiceIndex + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(choiceIndex)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddChoice}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Choice
          </Button>
        </div>
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
            <Label htmlFor={`randomized-choice-${index}`}>
              Randomized Choice
            </Label>
            <Switch
              id={`randomized-choice-${index}`}
              checked={isChoiceRandomized}
              onCheckedChange={(checked) =>
                setValue(
                  `questions.${index}.isChoiceRandomized` as const,
                  checked
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
