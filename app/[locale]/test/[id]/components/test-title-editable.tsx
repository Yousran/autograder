"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableSubmit,
  EditableCancel,
  EditableTrigger,
  EditableToolbar,
} from "@/components/ui/editable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  testId: string;
  initialTitle: string;
}

export function TestTitleEditable({ testId, initialTitle }: Props) {
  const tApiTests = useTranslations("Api.tests");
  const tCommon = useTranslations("Common");

  async function handleSubmit(value: string) {
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? tApiTests("updateFailed"),
        );
        return;
      }

      toast.success(tApiTests("updateSuccess"));
    } catch {
      toast.error(tApiTests("updateFailed"));
    }
  }

  return (
    <Editable
      defaultValue={initialTitle}
      onSubmit={handleSubmit}
      className="group"
    >
      <EditableArea>
        <EditablePreview
          className="text-3xl md:text-3xl text-center font-bold border-transparent px-0 py-0 rounded-none"
          data-testid="test-title-preview"
        />
        <EditableInput
          className="text-3xl md:text-3xl font-bold"
          data-testid="test-title-input"
        />
        <EditableTrigger
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          asChild
        ></EditableTrigger>
      </EditableArea>
      <EditableToolbar>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <EditableSubmit asChild>
                <Button size="sm" aria-label={tCommon("save")}>
                  <CheckIcon />
                </Button>
              </EditableSubmit>
            </TooltipTrigger>
            <TooltipContent>{tCommon("save")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <EditableCancel asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={tCommon("cancel")}
                >
                  <XIcon />
                </Button>
              </EditableCancel>
            </TooltipTrigger>
            <TooltipContent>{tCommon("cancel")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </EditableToolbar>
    </Editable>
  );
}
