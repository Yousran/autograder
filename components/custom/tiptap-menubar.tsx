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
  VideoIcon,
  HighlighterIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  WrenchIcon,
  LayoutPanelTopIcon,
  LayoutPanelLeftIcon,
  LayoutTemplateIcon,
  Trash2Icon,
  TypeIcon,
  Undo2Icon,
  Redo2Icon,
  ImagePlusIcon,
  Grid2X2PlusIcon,
  TableCellsMergeIcon,
  TableCellsSplitIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TiptapMenubar = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;

  const getAlignIcon = (editor: Editor) => {
    if (editor.isActive({ textAlign: "center" }))
      return <AlignCenterIcon className="h-4 w-4" />;
    if (editor.isActive({ textAlign: "right" }))
      return <AlignRightIcon className="h-4 w-4" />;
    if (editor.isActive({ textAlign: "justify" }))
      return <AlignJustifyIcon className="h-4 w-4" />;
    return <AlignLeftIcon className="h-4 w-4" />;
  };

  return (
    <Menubar className="bg-transparent border-none shadow-sm flex flex-wrap rounded-b-none">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2Icon className="h-4 w-4" />
      </Button>

      {/* Formatting */}
      <MenubarMenu>
        <MenubarTrigger>
          <TypeIcon className="h-4 w-4" />
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            data-active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="mr-2 h-4 w-4" />
            Bold
          </MenubarItem>
          <MenubarItem
            data-active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="mr-2 h-4 w-4" />
            Italic
          </MenubarItem>
          <MenubarItem
            data-active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="mr-2 h-4 w-4" />
            Underline
          </MenubarItem>
          <MenubarItem
            data-active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <HighlighterIcon className="mr-2 h-4 w-4" />
            Highlight
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            data-active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrderedIcon className="mr-2 h-4 w-4" />
            Ordered List
          </MenubarItem>
          <MenubarItem
            data-active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <CodeIcon className="mr-2 h-4 w-4" />
            Code Block
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="flex items-center gap-2">
          {getAlignIcon(editor)}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            data-active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeftIcon className="mr-2 h-4 w-4" />
            Left
          </MenubarItem>
          <MenubarItem
            data-active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenterIcon className="mr-2 h-4 w-4" />
            Center
          </MenubarItem>
          <MenubarItem
            data-active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRightIcon className="mr-2 h-4 w-4" />
            Right
          </MenubarItem>
          <MenubarItem
            data-active={editor.isActive({ textAlign: "justify" })}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustifyIcon className="mr-2 h-4 w-4" />
            Justify
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Insert */}
      <MenubarMenu>
        <MenubarTrigger>
          <ImagePlusIcon className="h-4 w-4" />
        </MenubarTrigger>
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
            <Grid2X2PlusIcon className="mr-2 h-4 w-4" />
            Table
          </MenubarItem>
          <MenubarItem
            onClick={() => {
              const url = prompt("Masukkan URL gambar:");
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
          >
            <ImagePlusIcon className="mr-2 h-4 w-4" />
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
        <MenubarTrigger>
          <TableIcon className="h-4 w-4" />
        </MenubarTrigger>
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
            <TableCellsMergeIcon className="mr-2 h-4 w-4" />
            Merge Cells
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().splitCell().run()}>
            <TableCellsSplitIcon className="mr-2 h-4 w-4" />
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
    </Menubar>
  );
};

export default TiptapMenubar;
