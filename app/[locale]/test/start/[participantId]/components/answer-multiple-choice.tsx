"use client";

import { useId } from "react";
import { extractPlateText } from "./test-taker";
import type { Choice } from "./test-taker";

interface AnswerMultipleChoiceProps {
  questionId: string;
  choices: Choice[];
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Multiple-select (checkbox) answer input.
 * The parent is responsible for persisting the answer on navigation.
 */
export function AnswerMultipleChoice({
  choices,
  value,
  onChange,
}: AnswerMultipleChoiceProps) {
  const groupId = useId();

  const toggle = (choiceId: string) => {
    if (value.includes(choiceId)) {
      onChange(value.filter((id) => id !== choiceId));
    } else {
      onChange([...value, choiceId]);
    }
  };

  return (
    <fieldset
      className="flex flex-col gap-3"
      aria-label="Select all that apply"
    >
      <legend className="sr-only">Select all that apply</legend>
      {choices.map((choice) => {
        const inputId = `${groupId}-${choice.id}`;
        const isChecked = value.includes(choice.id);
        return (
          <label
            key={choice.id}
            htmlFor={inputId}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
              isChecked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <input
              type="checkbox"
              id={inputId}
              value={choice.id}
              checked={isChecked}
              onChange={() => toggle(choice.id)}
              className="mt-0.5 size-4 accent-primary"
              aria-label={extractPlateText(choice.choiceText)}
            />
            <span className="text-sm leading-relaxed">
              {extractPlateText(choice.choiceText)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
