"use client";

import { useFormContext } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Loader2 } from "lucide-react";
import TiptapEditor from "@/components/custom/tiptap-editor";
import { QuestionsFormData } from "@/types/question-form";
import { editQuestion } from "@/app/actions/question/edit";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

type EssayQuestionCardProps = {
  index: number;
  questionId?: string;
};

export function EssayQuestionCard({
  index,
  questionId,
}: EssayQuestionCardProps) {
  const { control, getValues } = useFormContext<QuestionsFormData>();
  const [isSaving, setIsSaving] = useState(false);
  const initialMount = useRef(true);

  // Debounced save function - no useTransition to avoid batching issues
  const debouncedSave = useDebouncedCallback(
    async () => {
      if (!questionId) return;

      setIsSaving(true);
      try {
        const currentData = getValues(`questions.${index}`);
        const result = await editQuestion(questionId, currentData);
        if (!result.success) {
          toast.error(result.error || "Failed to save question");
        }
      } finally {
        setIsSaving(false);
      }
    },
    1500 // 1.5 second debounce
  );

  // Handle field change and trigger save
  const handleFieldChange = useCallback(
    (onChange: (value: unknown) => void) => (value: unknown) => {
      onChange(value);
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
            <FormLabel className="flex items-center gap-2">
              Question
              {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            </FormLabel>
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
