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

interface Props {
  testId: string;
  initialTitle: string;
}

export function TestTitleEditable({ testId, initialTitle }: Props) {
  const tTests = useTranslations("Tests");
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
          (data as { error?: string }).error ?? tTests("updateFailed"),
        );
        return;
      }

      toast.success(tTests("updateSuccess"));
    } catch {
      toast.error(tTests("updateFailed"));
    }
  }

  return (
    <Editable
      defaultValue={initialTitle}
      onSubmit={handleSubmit}
      className="group"
    >
      <EditableArea>
        <EditablePreview className="text-2xl font-bold border-transparent px-0 py-0 rounded-none" />
        <EditableInput className="text-2xl font-bold" />
        <EditableTrigger
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          asChild
        ></EditableTrigger>
      </EditableArea>
      <EditableToolbar>
        <EditableSubmit asChild>
          <Button size="sm" aria-label={tCommon("save")}>
            <CheckIcon className="h-4 w-4" />
          </Button>
        </EditableSubmit>
        <EditableCancel asChild>
          <Button variant="outline" size="sm" aria-label={tCommon("cancel")}>
            <XIcon className="h-4 w-4" />
          </Button>
        </EditableCancel>
      </EditableToolbar>
    </Editable>
  );
}
