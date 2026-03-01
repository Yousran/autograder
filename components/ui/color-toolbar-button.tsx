"use client";

import * as React from "react";
import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
} from "@platejs/basic-styles/react";
import { useEditorRef, useEditorSelector } from "platejs/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ColorPicker } from "@/components/custom/color-picker";
import { cn } from "@/lib/utils";

interface ColorToolbarButtonProps {
  /** "color" for text color, "backgroundColor" for background color */
  nodeType: "color" | "backgroundColor";
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

export function ColorToolbarButton({
  nodeType,
  tooltip,
  children,
  className,
}: ColorToolbarButtonProps) {
  const editor = useEditorRef();

  const currentColor = useEditorSelector(
    (e) => {
      const marks = e.api.marks();
      return (marks?.[nodeType] as string | undefined) ?? "";
    },
    [nodeType],
  );

  const handleColorChange = React.useCallback(
    (hex: string) => {
      if (!editor.selection) return;
      editor.tf.addMark(
        nodeType === "color"
          ? FontColorPlugin.key
          : FontBackgroundColorPlugin.key,
        hex,
      );
    },
    [editor, nodeType],
  );

  const handleColorClear = React.useCallback(() => {
    if (!editor.selection) return;
    editor.tf.removeMark(
      nodeType === "color"
        ? FontColorPlugin.key
        : FontBackgroundColorPlugin.key,
    );
  }, [editor, nodeType]);

  return (
    <Tooltip>
      <ColorPicker
        value={currentColor}
        onChange={handleColorChange}
        onClear={handleColorClear}
      >
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex cursor-pointer flex-col items-center justify-center rounded-md px-1.5 py-1 text-sm outline-none transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            <span className="[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              {children}
            </span>
            {/* Color indicator strip */}
            <span
              className="mt-0.5 h-0.75 w-full rounded-full"
              style={{
                backgroundColor:
                  currentColor ||
                  (nodeType === "color" ? "#000000" : "#fef08a"),
              }}
            />
          </button>
        </TooltipTrigger>
      </ColorPicker>
      {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
    </Tooltip>
  );
}
