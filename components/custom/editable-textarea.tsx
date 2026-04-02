"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const t = useTranslations();
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [debouncedValue] = useDebounce(value, debounceDelay);

  // Sync value with initialValue only if there are no unsaved changes.
  // This preserves user edits during parent re-renders (e.g., reordering questions).
  useEffect(() => {
    // Only update if value hasn't been modified from the initial value,
    // or if we're receiving a completely new initialValue.
    setValue((prev) => (prev === initialValue ? initialValue : prev));
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
        toast.error(t("Components.editableTextarea.saveFailed"));
      } finally {
        setIsSaving(false);
      }
    },
    [initialValue, onUpdate, onUpdateError, t],
  );

  // Keep a ref to the latest saveValue so the auto-save effect below does not
  // need to list it as a dependency. This prevents the effect from re-firing
  // just because the parent re-rendered (e.g. after a reorder), which would
  // recreate onUpdate and therefore saveValue on every render.
  const saveValueRef = useRef(saveValue);
  useEffect(() => {
    saveValueRef.current = saveValue;
  });

  // Auto-save when debounced value changes (only if different from initial)
  useEffect(() => {
    if (debouncedValue !== initialValue) {
      saveValueRef.current(debouncedValue);
    }
  }, [debouncedValue, initialValue]);

  const handleBlur = async () => {
    // If value hasn't changed, don't update
    if (value === initialValue || isSaving) {
      return;
    }

    // Save immediately on blur
    await saveValueRef.current(value);
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
