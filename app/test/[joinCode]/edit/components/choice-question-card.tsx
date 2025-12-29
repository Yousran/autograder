"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { useCallback, useEffect, useRef } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import TiptapEditor from "@/components/custom/tiptap-editor";
import { QuestionsValidation } from "@/types/question";
import { editQuestion } from "@/app/actions/question/edit";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { ChoiceList } from "./choice-list";
import { useSyncTracker } from "../context/optimistic-context";

type ChoiceQuestionCardProps = {
  index: number;
  questionId?: string;
};

export function ChoiceQuestionCard({
  index,
  questionId,
}: ChoiceQuestionCardProps) {
  const { control, getValues, setValue } =
    useFormContext<QuestionsValidation>();
  const { trackSync } = useSyncTracker();
  const initialMount = useRef(true);

  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${index}.choices`,
  });

  // Debounced save function - optimistic UI with global sync tracking
  const debouncedSave = useDebouncedCallback(async () => {
    if (!questionId) return;

    await trackSync(
      `question-${questionId}`,
      async () => {
        const currentData = getValues(`questions.${index}`);
        const result = await editQuestion(questionId, currentData);
        if (!result.success) {
          toast.error("Failed to save question");
        }
        return result;
      },
      "Saving question..."
    );
  }, 1500);

  // Handle field change - immediate UI update, debounced server sync
  const handleFieldChange = useCallback(
    (onChange: (value: unknown) => void) => (value: unknown) => {
      // Immediate UI update (optimistic)
      onChange(value);
      // Debounced server sync
      if (!initialMount.current && questionId) {
        debouncedSave();
      }
    },
    [questionId, debouncedSave]
  );

  // Mark initial mount as complete
  useEffect(() => {
    initialMount.current = false;
  }, []);

  // Handle selecting the correct answer (only one allowed for choice)
  const handleSelectCorrect = useCallback(
    (choiceIndex: number) => {
      // Immediate UI update (optimistic) - set all choices to incorrect first
      fields.forEach((_, i) => {
        setValue(
          `questions.${index}.choices.${i}.isCorrect`,
          i === choiceIndex,
          { shouldDirty: true }
        );
      });
      // Debounced server sync
      if (!initialMount.current && questionId) {
        debouncedSave();
      }
    },
    [fields, setValue, index, questionId, debouncedSave]
  );

  const handleAddChoice = useCallback(() => {
    // Immediate UI update (optimistic)
    append({ choiceText: "option", isCorrect: false });
    // Debounced server sync
    if (questionId) {
      debouncedSave();
    }
  }, [append, questionId, debouncedSave]);

  const handleRemoveChoice = useCallback(
    (choiceIndex: number) => {
      if (fields.length <= 2) {
        toast.error("At least 2 choices are required");
        return;
      }
      // Immediate UI update (optimistic)
      remove(choiceIndex);
      // Debounced server sync
      if (questionId) {
        debouncedSave();
      }
    },
    [fields.length, remove, questionId, debouncedSave]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Question Text */}
      <FormField
        control={control}
        name={`questions.${index}.questionText`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Question</FormLabel>
            <FormControl>
              <TiptapEditor
                value={field.value}
                onChange={handleFieldChange(field.onChange)}
                placeholder="Enter your question here..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Choices */}
      <ChoiceList
        questionIndex={index}
        fields={fields}
        description="Click on a choice to mark it as the correct answer"
        onChoiceClick={handleSelectCorrect}
        onAddChoice={handleAddChoice}
        onRemoveChoice={handleRemoveChoice}
        onFieldChange={handleFieldChange}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Max Score */}
        <FormField
          control={control}
          name={`questions.${index}.maxScore`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Max Score</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) =>
                    handleFieldChange(field.onChange)(Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Randomize Choices Toggle */}
        <FormField
          control={control}
          name={`questions.${index}.isChoiceRandomized`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
              <div className="space-y-0.5">
                <FormLabel>Randomize</FormLabel>
                <FormDescription className="text-xs">
                  Shuffle choice order
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={handleFieldChange(field.onChange)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
