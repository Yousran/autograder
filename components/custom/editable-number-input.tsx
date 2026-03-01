"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    const next = debouncedValue ?? null;
    const prev = initialValue ?? null;
    if (next !== prev) {
      saveValueRef.current(debouncedValue);
    }
  }, [debouncedValue, initialValue]);

  const handleBlur = async () => {
    // If value hasn't changed, don't update
    const next = value ?? null;
    const prev = initialValue ?? null;
    if (next === prev || isSaving) {
      return;
    }

    // Save immediately on blur
    await saveValueRef.current(value);
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
