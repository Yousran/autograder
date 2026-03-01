"use client";

import * as React from "react";

import { indentListItems, unindentListItems } from "@platejs/list-classic";
import {
  useListToolbarButton,
  useListToolbarButtonState,
} from "@platejs/list-classic/react";
import {
  IndentIcon,
  List,
  ListOrdered,
  ListTodo,
  OutdentIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { KEYS } from "platejs";
import { useEditorRef } from "platejs/react";

import { ToolbarButton } from "./toolbar";

const nodeTypeIconMap: Record<string, React.JSX.Element> = {
  [KEYS.olClassic]: <ListOrdered />,
  [KEYS.taskList]: <ListTodo />,
  [KEYS.ulClassic]: <List />,
};

export function ListToolbarButton({
  nodeType = KEYS.ulClassic,
  ...props
}: React.ComponentProps<typeof ToolbarButton> & {
  nodeType?: string;
}) {
  const t = useTranslations("Components.editor");
  const state = useListToolbarButtonState({ nodeType });
  const { props: buttonProps } = useListToolbarButton(state);

  const nodeTypeLabelMap: Record<string, string> = {
    [KEYS.olClassic]: t("numberedList"),
    [KEYS.taskList]: t("taskList"),
    [KEYS.ulClassic]: t("bulletedList"),
  };

  const icon = nodeTypeIconMap[nodeType] ?? nodeTypeIconMap[KEYS.ulClassic];
  const label = nodeTypeLabelMap[nodeType] ?? t("bulletedList");

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={label}>
      {icon}
    </ToolbarButton>
  );
}

export function IndentToolbarButton({
  reverse = false,
  ...props
}: React.ComponentProps<typeof ToolbarButton> & {
  reverse?: boolean;
}) {
  const t = useTranslations("Components.editor");
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        if (reverse) {
          unindentListItems(editor);
        } else {
          indentListItems(editor);
        }
      }}
      tooltip={reverse ? t("outdent") : t("indent")}
    >
      {reverse ? <OutdentIcon /> : <IndentIcon />}
    </ToolbarButton>
  );
}
