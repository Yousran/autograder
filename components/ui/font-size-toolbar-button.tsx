"use client";

import * as React from "react";
import { FontSizePlugin } from "@platejs/basic-styles/react";
import { useEditorRef, useEditorSelector } from "platejs/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const FONT_SIZES = [
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "24",
  "28",
  "32",
  "36",
  "48",
  "72",
];

const DEFAULT_SIZE = "16";

interface FontSizeToolbarButtonProps {
  className?: string;
}

export function FontSizeToolbarButton({
  className,
}: FontSizeToolbarButtonProps) {
  const editor = useEditorRef();

  const currentSize = useEditorSelector((e) => {
    const marks = e.api.marks();
    return (marks?.["fontSize"] as string | undefined) ?? "";
  }, []);

  const handleSizeChange = React.useCallback(
    (size: string) => {
      if (!editor.selection) return;
      editor.tf.addMark(FontSizePlugin.key, size + "px");
    },
    [editor],
  );

  // Strip "px" if present for display
  const displaySize = currentSize.replace("px", "") || DEFAULT_SIZE;

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 cursor-pointer items-center justify-center gap-0.5 rounded-md px-1.5 font-mono text-sm outline-none transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
                className,
              )}
            >
              <span className="min-w-6 text-center tabular-nums">
                {displaySize}
              </span>
              <svg
                className="size-3 opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Font size</TooltipContent>
        <DropdownMenuContent align="start" className="min-w-16">
          {FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              className={cn(
                "justify-center font-mono tabular-nums",
                displaySize === size && "bg-accent text-accent-foreground",
              )}
              onSelect={() => handleSizeChange(size)}
            >
              {size}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  );
}
