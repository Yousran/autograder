"use client";

import { useId } from "react";
import { extractPlateText } from "./test-taker";
import type { Choice } from "./test-taker";

interface AnswerChoiceProps {
  questionId: string;
  choices: Choice[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Single-choice (radio) answer input.
 * The parent is responsible for persisting the answer on navigation.
 */
export function AnswerChoice({ choices, value, onChange }: AnswerChoiceProps) {
  const groupName = useId();

  return (
    <fieldset className="flex flex-col gap-3" aria-label="Choose one answer">
      <legend className="sr-only">Choose one answer</legend>
      {choices.map((choice) => {
        const inputId = `${groupName}-${choice.id}`;
        const isSelected = value === choice.id;
        return (
          <label
            key={choice.id}
            htmlFor={inputId}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
              isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <input
              type="radio"
              id={inputId}
              name={groupName}
              value={choice.id}
              checked={isSelected}
              onChange={() => onChange(choice.id)}
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
