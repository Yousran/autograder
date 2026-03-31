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

export function EditableNumberInput({
  initialValue,
  onUpdate,
  onUpdateError,
  debounceDelay = 500,
  min = 1,
  max,
  ...props
}: {
  initialValue: number | null;
  onUpdate: (value: number | null) => Promise<void> | void;
  onUpdateError?: (error: Error) => void;
  debounceDelay?: number;
  min?: number;
  max?: number;
}) {
  const [value, setValue] = useState<number | undefined>(
    initialValue ?? undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [debouncedValue] = useDebounce(value, debounceDelay);

  // Sync value with initialValue only if there are no unsaved changes.
  // This preserves user edits during parent re-renders (e.g., reordering questions).
  useEffect(() => {
    // Only update if value hasn't been modified from the initial value,
    // or if we're receiving a completely new initialValue.
    setValue((prev) =>
      prev === (initialValue ?? undefined) ? (initialValue ?? undefined) : prev,
    );
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
    <div onBlur={handleBlur} data-saving={isSaving} {...props}>
      <NumberField
        value={value}
        onValueChange={(v) => setValue(v ?? undefined)}
        min={min}
        max={max}
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
