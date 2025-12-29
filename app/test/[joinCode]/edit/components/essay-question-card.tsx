"use client";

import { useFormContext } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import TiptapEditor from "@/components/custom/tiptap-editor";
import { QuestionsValidation } from "@/types/question";
import { editQuestion } from "@/app/actions/question/edit";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { useSyncTracker } from "../context/optimistic-context";

type EssayQuestionCardProps = {
  index: number;
  questionId?: string;
};

export function EssayQuestionCard({
  index,
  questionId,
}: EssayQuestionCardProps) {
  const { control, getValues } = useFormContext<QuestionsValidation>();
  const { trackSync } = useSyncTracker();
  const initialMount = useRef(true);

  // Debounced save function - optimistic UI with global sync tracking
  const debouncedSave = useDebouncedCallback(
    async () => {
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
    },
    1500 // 1.5 second debounce
  );

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

      {/* Answer Text */}
      <FormField
        control={control}
        name={`questions.${index}.answerText`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Answer Key</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  handleFieldChange(field.onChange)(e.target.value)
                }
                placeholder="Enter the expected answer..."
                className="min-h-24 resize-y"
              />
            </FormControl>
            <FormDescription>
              This is the reference answer used for grading
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
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

        {/* Exact Answer Toggle */}
        <FormField
          control={control}
          name={`questions.${index}.isExactAnswer`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
              <div className="space-y-0.5">
                <FormLabel>Exact Match</FormLabel>
                <FormDescription className="text-xs">
                  Require exact answer match
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
