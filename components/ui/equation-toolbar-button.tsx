"use client";

import * as React from "react";

import { insertInlineEquation } from "@platejs/math";
import { RadicalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditorRef } from "platejs/react";

import { ToolbarButton } from "./toolbar";

export function InlineEquationToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>,
) {
  const t = useTranslations("Components.editor");
  const editor = useEditorRef();

  return (
    <ToolbarButton
      tooltip={t("inlineEquation")}
      {...props}
      onClick={() => {
        insertInlineEquation(editor);
      }}
    >
      <RadicalIcon />
    </ToolbarButton>
  );
}
