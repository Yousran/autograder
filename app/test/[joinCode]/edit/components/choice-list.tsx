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
import { cn } from "@/lib/utils";

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
              <FormField
                control={control}
                name={`questions.${questionIndex}.choices.${choiceIndex}.choiceText`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <button
                        type="button"
                        onClick={() => onChoiceClick(choiceIndex)}
                        className={cn(
                          "w-full p-4 border-2 rounded-md text-left transition-colors flex items-center gap-2",
                          isCorrect
                            ? "bg-green-100/10 border-green-500"
                            : "bg-card border-secondary hover:border-primary"
                        )}
                      >
                        <Input
                          placeholder={`Option ${choiceIndex + 1}`}
                          {...field}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onFieldChange(field.onChange)(e.target.value)
                          }
                          className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent"
                        />
                        {isCorrect && (
                          <Check className="w-5 h-5 text-green-500 shrink-0" />
                        )}
                      </button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
