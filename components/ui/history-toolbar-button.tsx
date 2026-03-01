"use client";

import * as React from "react";

import { Redo2Icon, Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditorRef, useEditorSelector } from "platejs/react";

import { ToolbarButton } from "./toolbar";

export function RedoToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>,
) {
  const t = useTranslations("Components.editor");
  const editor = useEditorRef();
  const disabled = useEditorSelector(
    (editor) => editor.history.redos.length === 0,
    [],
  );

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.redo()}
      onMouseDown={(e) => e.preventDefault()}
      tooltip={t("redo")}
    >
      <Redo2Icon />
    </ToolbarButton>
  );
}

export function UndoToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>,
) {
  const t = useTranslations("Components.editor");
  const editor = useEditorRef();
  const disabled = useEditorSelector(
    (editor) => editor.history.undos.length === 0,
    [],
  );

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.undo()}
      onMouseDown={(e) => e.preventDefault()}
      tooltip={t("undo")}
    >
      <Undo2Icon />
    </ToolbarButton>
  );
}
