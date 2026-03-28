"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type ChoiceItemProps = ComponentProps<"div"> & {
  value?: string;
  choiceIndex?: number;
};

// Individual choice item: preserve original color and layout classes
export const ChoiceItem = ({
  className,
  children,
  choiceIndex,
  ...props
}: ChoiceItemProps) => (
  <div
    className={cn(
      "flex flex-row items-start justify-center rounded-md gap-3 transition-all",
      className,
    )}
    data-testid={
      choiceIndex !== undefined ? `choice-row-${choiceIndex}` : undefined
    }
    {...props}
  >
    {children}
  </div>
);

export default ChoiceItem;
