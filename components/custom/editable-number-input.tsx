"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

interface EditableNumberInputProps {
  initialValue: number | null;
  onUpdate: (value: number | null) => Promise<void> | void;
  onUpdateError?: (error: Error) => void;
  debounceDelay?: number;
}

export function EditableNumberInput({
  initialValue,
  onUpdate,
  onUpdateError,
  debounceDelay = 500,
}: EditableNumberInputProps) {
  const [value, setValue] = useState<number | undefined>(
    initialValue ?? undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [debouncedValue] = useDebounce(value, debounceDelay);

  // Sync value with initialValue when it changes from parent
  useEffect(() => {
    setValue(initialValue ?? undefined);
  }, [initialValue]);

  const saveValue = useCallback(
    async (valueToSave: number | undefined) => {
      try {
        setIsSaving(true);
        await onUpdate(valueToSave ?? null);
      } catch (error) {
        // Revert to previous value on error
        setValue(initialValue ?? undefined);
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Failed to update value:", err);
        onUpdateError?.(err);
      } finally {
        setIsSaving(false);
      }
    },
    [initialValue, onUpdate, onUpdateError],
  );

  // Auto-save when debounced value changes (only if different from initial)
  useEffect(() => {
    const next = debouncedValue ?? null;
    const prev = initialValue ?? null;
    if (next !== prev) {
      saveValue(debouncedValue);
    }
  }, [debouncedValue, initialValue, saveValue]);

  const handleBlur = async () => {
    // If value hasn't changed, don't update
    const next = value ?? null;
    const prev = initialValue ?? null;
    if (next === prev || isSaving) {
      return;
    }

    // Save immediately on blur
    await saveValue(value);
  };

  return (
    <div onBlur={handleBlur} data-saving={isSaving}>
      <NumberField
        value={value}
        onValueChange={(v) => setValue(v ?? undefined)}
        min={1}
        step={1}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </div>
  );
}
