"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type ChoiceItemProps = ComponentProps<"div"> & { value?: string };

// Individual choice item: preserve original color and layout classes
export const ChoiceItem = ({
  className,
  children,
  ...props
}: ChoiceItemProps) => (
  <div
    className={cn(
      "flex flex-row bg-muted items-start justify-between rounded-md p-4 transition-all",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export default ChoiceItem;
