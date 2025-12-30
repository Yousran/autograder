"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Check } from "lucide-react";
import { QuestionsValidation } from "@/types/question";
import ChoiceComponent from "@/components/custom/choice";

type ChoiceField = {
  id: string;
  choiceText: string;
  isCorrect: boolean;
};

type ChoiceListProps = {
  questionIndex: number;
  fields: ChoiceField[];
  description: string;
  onChoiceClick: (choiceIndex: number) => void;
  onAddChoice: () => void;
  onRemoveChoice: (choiceIndex: number) => void;
  onFieldChange: (
    onChange: (value: unknown) => void
  ) => (value: unknown) => void;
};

export function ChoiceList({
  questionIndex,
  fields,
  description,
  onChoiceClick,
  onAddChoice,
  onRemoveChoice,
  onFieldChange,
}: ChoiceListProps) {
  const { control, watch } = useFormContext<QuestionsValidation>();

  return (
    <div className="space-y-2">
      <FormLabel>Choices</FormLabel>
      <FormDescription>{description}</FormDescription>
      <div className="space-y-2">
        {fields.map((field, choiceIndex) => {
          const isCorrect = watch(
            `questions.${questionIndex}.choices.${choiceIndex}.isCorrect`
          );

          return (
            <div key={field.id} className="flex items-center gap-2">
              <ChoiceComponent isCorrect={isCorrect}>
                <Button
                  type="button"
                  variant={isCorrect ? "default" : "outline"}
                  size="icon"
                  onClick={() => onChoiceClick(choiceIndex)}
                  className="shrink-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <FormField
                  control={control}
                  name={`questions.${questionIndex}.choices.${choiceIndex}.choiceText`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Option ${choiceIndex + 1}`}
                          {...field}
                          onChange={(e) =>
                            onFieldChange(field.onChange)(e.target.value)
                          }
                          className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ChoiceComponent>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveChoice(choiceIndex)}
                disabled={fields.length <= 2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddChoice}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Choice
      </Button>
    </div>
  );
}
