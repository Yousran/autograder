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
  initialDescription: string | null;
}

export function TestDescriptionEditable({ testId, initialDescription }: Props) {
  const tApiTests = useTranslations("Api.tests");
  const tComponentTest = useTranslations("Components.test");
  const tCommon = useTranslations("Common");

  async function handleSubmit(value: string) {
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value || null }),
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
      defaultValue={initialDescription ?? ""}
      placeholder={tComponentTest("descriptionPlaceholder")}
      onSubmit={handleSubmit}
      className="group"
    >
      <EditableArea>
        <EditablePreview className="whitespace-pre-wrap text-sm text-justify text-muted-foreground border-transparent px-0 py-0 rounded-none" />
        <EditableInput asChild>
          <textarea
            rows={4}
            className="w-full resize-none rounded-sm border border-input bg-transparent py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </EditableInput>
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
