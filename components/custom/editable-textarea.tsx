"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface EditableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  initialValue: string;
  onUpdate: (value: string) => Promise<void> | void;
  onUpdateError?: (error: Error) => void;
  debounceDelay?: number;
}

export function EditableTextarea({
  initialValue,
  onUpdate,
  onUpdateError,
  debounceDelay = 500,
  ...props
}: EditableTextareaProps) {
  const t = useTranslations("Components.editableTextarea");
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [debouncedValue] = useDebounce(value, debounceDelay);

  // Sync value with initialValue when it changes from parent
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const saveValue = useCallback(
    async (valueToSave: string) => {
      try {
        setIsSaving(true);
        await onUpdate(valueToSave);
      } catch (error) {
        // Revert to previous value on error
        setValue(initialValue);
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Failed to update value:", err);
        onUpdateError?.(err);
        toast.error(t("saveFailed"));
      } finally {
        setIsSaving(false);
      }
    },
    [initialValue, onUpdate, onUpdateError, t],
  );

  // Auto-save when debounced value changes (only if different from initial)
  useEffect(() => {
    if (debouncedValue !== initialValue) {
      saveValue(debouncedValue);
    }
  }, [debouncedValue, initialValue, saveValue]);

  const handleBlur = async () => {
    // If value hasn't changed, don't update
    if (value === initialValue || isSaving) {
      return;
    }

    // Save immediately on blur
    await saveValue(value);
  };

  return (
    <Textarea
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      data-saving={isSaving}
    />
  );
}
