"use client";

import { Editor } from "@tiptap/react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "@/components/ui/menubar";
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
  SplitIcon,
  MergeIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  WrenchIcon,
  LayoutPanelTopIcon,
  LayoutPanelLeftIcon,
  LayoutTemplateIcon,
  Trash2Icon,
} from "lucide-react";

const TiptapMenubar = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;

  return (
    // <div className="border border-input dark:border-input/30 rounded-md shadow-sm">
    <Menubar className="bg-transparent border-none shadow-sm flex flex-wrap rounded-b-none">
      {/* Formatting */}
      <MenubarMenu>
        <MenubarTrigger>Format</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            variant={editor.isActive("bold") ? "active" : "default"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="mr-2 h-4 w-4" />
            Bold
          </MenubarItem>
          <MenubarItem
            variant={editor.isActive("italic") ? "active" : "default"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="mr-2 h-4 w-4" />
            Italic
          </MenubarItem>
          <MenubarItem
            variant={editor.isActive("underline") ? "active" : "default"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="mr-2 h-4 w-4" />
            Underline
          </MenubarItem>
          <MenubarItem
            variant={editor.isActive("highlight") ? "active" : "default"}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <HighlighterIcon className="mr-2 h-4 w-4" />
            Highlight
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            variant={editor.isActive("orderedList") ? "active" : "default"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrderedIcon className="mr-2 h-4 w-4" />
            Ordered List
          </MenubarItem>
          <MenubarItem
            variant={editor.isActive("codeBlock") ? "active" : "default"}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <CodeIcon className="mr-2 h-4 w-4" />
            Code Block
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Align</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            variant={
              editor.isActive({ textAlign: "left" }) ? "active" : "default"
            }
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeftIcon className="mr-2 h-4 w-4" />
            Left
          </MenubarItem>
          <MenubarItem
            variant={
              editor.isActive({ textAlign: "center" }) ? "active" : "default"
            }
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenterIcon className="mr-2 h-4 w-4" />
            Center
          </MenubarItem>
          <MenubarItem
            variant={
              editor.isActive({ textAlign: "right" }) ? "active" : "default"
            }
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRightIcon className="mr-2 h-4 w-4" />
            Right
          </MenubarItem>
          <MenubarItem
            variant={
              editor.isActive({ textAlign: "justify" }) ? "active" : "default"
            }
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustifyIcon className="mr-2 h-4 w-4" />
            Justify
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Insert */}
      <MenubarMenu>
        <MenubarTrigger>Insert</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
                .run()
            }
          >
            <TableIcon className="mr-2 h-4 w-4" />
            Table
          </MenubarItem>
          <MenubarItem
            onClick={() => {
              const url = prompt("Masukkan URL gambar:");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Image
          </MenubarItem>
          <MenubarItem
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
            <VideoIcon className="mr-2 h-4 w-4" />
            YouTube Video
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Table Controls */}
      <MenubarMenu>
        <MenubarTrigger>Table</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Add Column Before
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <ArrowRightIcon className="mr-2 h-4 w-4" />
            Add Column After
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            <ArrowUpIcon className="mr-2 h-4 w-4" />
            Add Row Before
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <ArrowDownIcon className="mr-2 h-4 w-4" />
            Add Row After
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().deleteRow().run()}>
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete Row
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete Column
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete Table
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().mergeCells().run()}
          >
            <MergeIcon className="mr-2 h-4 w-4" />
            Merge Cells
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().splitCell().run()}>
            <SplitIcon className="mr-2 h-4 w-4" />
            Split Cell
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          >
            <LayoutPanelTopIcon className="mr-2 h-4 w-4" />
            Toggle Header Row
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
          >
            <LayoutPanelLeftIcon className="mr-2 h-4 w-4" />
            Toggle Header Column
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().toggleHeaderCell().run()}
          >
            <LayoutTemplateIcon className="mr-2 h-4 w-4" />
            Toggle Header Cell
          </MenubarItem>
          <MenubarItem
            onClick={() =>
              editor.chain().focus().setCellAttribute("colspan", 2).run()
            }
          >
            <WrenchIcon className="mr-2 h-4 w-4" />
            Set Colspan = 2
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* History */}
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <UndoIcon className="mr-2 h-4 w-4" />
            Undo
          </MenubarItem>
          <MenubarItem
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <RedoIcon className="mr-2 h-4 w-4" />
            Redo
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
    // </div>
  );
};

export default TiptapMenubar;
