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
    <div className="group/add relative flex items-center justify-center py-1">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border pointer-events-none" />
      <Button
        size="sm"
        variant="outline"
        className={cn(
          "relative z-10 bg-background h-7 px-3 text-xs",
          !alwaysVisible &&
            "opacity-0 group-hover/add:opacity-100 focus:opacity-100 transition-opacity",
        )}
        onClick={onClick}
      >
        <PlusIcon className="size-3" />
        {t("addQuestion")}
      </Button>
    </div>
  );
}
