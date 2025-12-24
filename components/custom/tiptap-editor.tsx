"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Gapcursor from "@tiptap/extension-gapcursor";
import Dropcursor from "@tiptap/extension-dropcursor";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import { all, createLowlight } from "lowlight";
import TiptapMenubar from "./tiptap-menubar";

interface TiptapEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const lowlight = createLowlight(all);
const limit = 600;

const TiptapEditor = ({
  value = "",
  onChange,
  placeholder = "Write something...",
}: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      Document,
      Gapcursor,
      Dropcursor.configure({ width: 2 }),
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Highlight,
      HardBreak,
      History,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["paragraph"] }),
      OrderedList,
      ListItem,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      Image,
      Youtube,
      CharacterCount.configure({ limit }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-48 p-4 selection:bg-primary selection:text-primary-foreground",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  // Sync external changes to the editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border-input dark:bg-input/50 w-full rounded-md border bg-transparent text-base shadow-xs outline-none">
      <TiptapMenubar editor={editor} />
      <EditorContent editor={editor} />
      <div className="m-4 text-sm text-card-foreground">
        {editor.storage.characterCount.characters()} / {limit} characters
        <br />
        {editor.storage.characterCount.words()} words
      </div>
    </div>
  );
};

export default TiptapEditor;
