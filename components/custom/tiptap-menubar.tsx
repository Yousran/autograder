"use client";

import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  ListOrderedIcon,
  TableIcon,
  CodeIcon,
  ImageIcon,
  VideoIcon,
  UndoIcon,
  RedoIcon,
  HighlighterIcon,
} from "lucide-react";

const TiptapMenubar = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-b-input dark:border-b-input/30 shadow-xs outline-none">
      <Button
        variant={editor.isActive("bold") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive("italic") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive("underline") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive("highlight") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <HighlighterIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeftIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenterIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRightIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={
          editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"
        }
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustifyIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive("orderedList") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
            .run()
        }
      >
        <TableIcon className="w-4 h-4" />
      </Button>

      <Button
        variant={editor.isActive("codeBlock") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <CodeIcon className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        onClick={() => {
          const url = prompt("Masukkan URL gambar:");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
      >
        <ImageIcon className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        onClick={() => {
          const url = prompt("Masukkan URL video:");
          if (url) {
            editor.commands.setYoutubeVideo({
              src: url,
              width: Math.max(320, 480),
              height: Math.max(180, 270),
            });
          }
        }}
      >
        <VideoIcon className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <UndoIcon className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <RedoIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default TiptapMenubar;
