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
import { useSync } from "../../context/sync-context";

export function TestDescriptionEditable({
  testId,
  initialDescription,
}: {
  testId: string;
  initialDescription: string | null;
}) {
  const t = useTranslations();
  const { setSaving, setSaved, setError } = useSync();

  async function handleSubmit(value: string) {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          (data as { error?: string }).error ?? t("Api.tests.updateFailed");
        toast.error(errorMsg);
        setError(errorMsg);
        return;
      }

      setSaved(true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : t("Api.tests.updateFailed");
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Editable
      defaultValue={initialDescription ?? ""}
      placeholder={t("Components.test.descriptionPlaceholder")}
      onSubmit={handleSubmit}
      className="group"
    >
      <EditableArea>
        <EditablePreview
          className="whitespace-pre-wrap text-sm text-justify text-muted-foreground border-transparent px-0 py-0 rounded-none"
          data-testid="test-description-preview"
        />
        <EditableInput asChild>
          <textarea
            rows={4}
            className="w-full resize-none rounded-sm border border-input bg-transparent py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="test-description-input"
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
                <Button size="sm" aria-label={t("Common.save")}>
                  <CheckIcon />
                </Button>
              </EditableSubmit>
            </TooltipTrigger>
            <TooltipContent>{t("Common.save")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <EditableCancel asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t("Common.cancel")}
                >
                  <XIcon />
                </Button>
              </EditableCancel>
            </TooltipTrigger>
            <TooltipContent>{t("Common.cancel")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </EditableToolbar>
    </Editable>
  );
}
