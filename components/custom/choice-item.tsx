"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import type { ChoiceSchema } from "@/lib/schemas/choice";
import type { MultipleSelectChoiceSchema } from "@/lib/schemas/multiple-choice";

// Individual choice item: preserve original color and layout classes
export const ChoiceItem = ({
  className,
  children,
  choice,
  ...props
}: ComponentProps<"div"> & {
  choice?: ChoiceSchema | MultipleSelectChoiceSchema | null;
}) => (
  <div
    className={cn(
      "flex flex-row items-start justify-center rounded-md gap-3 transition-all p-3 outline-1",
      choice?.isCorrect ? "outline-green-500" : "outline-red-500",
      className,
    )}
    data-testid={choice?.id ? `choice-row-${choice.id}` : undefined}
    {...props}
  >
    {children}
  </div>
);

export default ChoiceItem;
