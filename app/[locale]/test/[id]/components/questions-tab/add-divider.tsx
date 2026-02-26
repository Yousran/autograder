"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddDividerProps {
  onClick: () => void;
  alwaysVisible?: boolean;
}

export function AddDivider({
  onClick,
  alwaysVisible = false,
}: AddDividerProps) {
  const t = useTranslations("Components.questionsTab");

  return (
    <div
      className={cn(
        "group/add relative transition-[padding] duration-200 py-2",
        !alwaysVisible && "hover:py-4",
      )}
    >
      {/* Always-visible divider line centered in the wrapper */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border pointer-events-none" />
      {/* Button slides in/out via grid-rows height animation */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          alwaysVisible
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr] group-hover/add:grid-rows-[1fr]",
        )}
      >
        <div className="overflow-hidden flex items-center justify-center">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "relative z-10 bg-background h-7 px-3 text-xs",
              !alwaysVisible &&
                "opacity-0 group-hover/add:opacity-100 transition-opacity duration-200",
            )}
            onClick={onClick}
          >
            <PlusIcon className="size-3" />
            {t("addQuestion")}
          </Button>
        </div>
      </div>
    </div>
  );
}
