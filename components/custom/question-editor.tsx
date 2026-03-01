"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
  FontSizePlugin,
  TextAlignPlugin,
} from "@platejs/basic-styles/react";
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@platejs/code-block/react";
import { toggleCodeBlock } from "@platejs/code-block";
import {
  BulletedListPlugin,
  ListItemContentPlugin,
  ListItemPlugin,
  ListPlugin,
  NumberedListPlugin,
} from "@platejs/list-classic/react";
import { EquationPlugin, InlineEquationPlugin } from "@platejs/math/react";
import { SubscriptPlugin, SuperscriptPlugin } from "@platejs/basic-nodes/react";
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@platejs/table/react";
import {
  AudioPlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from "@platejs/media/react";
import { CaptionPlugin } from "@platejs/caption/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import {
  BoldIcon,
  BracketsIcon,
  CodeIcon,
  Highlighter,
  ItalicIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  Type,
  UnderlineIcon,
} from "lucide-react";
import { KEYS } from "platejs";

import { BasicNodesKit } from "@/components/basic-nodes-kit";
import {
  BulletedListElement,
  ListItemElement,
  NumberedListElement,
} from "@/components/ui/list-classic-node";
import {
  CodeBlockElement,
  CodeLineElement,
  CodeSyntaxLeaf,
} from "@/components/ui/code-block-node";
import {
  EquationElement,
  InlineEquationElement,
} from "@/components/ui/equation-node";
import { AlignToolbarButton } from "@/components/ui/align-toolbar-button";
import { ColorToolbarButton } from "@/components/ui/color-toolbar-button";
import { FontSizeToolbarButton } from "@/components/ui/font-size-toolbar-button";
import {
  RedoToolbarButton,
  UndoToolbarButton,
} from "@/components/ui/history-toolbar-button";
import { InlineEquationToolbarButton } from "@/components/ui/equation-toolbar-button";
import { ListToolbarButton } from "@/components/ui/list-classic-toolbar-button";
import { FloatingToolbar } from "@/components/ui/floating-toolbar";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/ui/toolbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from "@/components/ui/table-node";
import { TableToolbarButton } from "@/components/ui/table-toolbar-button";
import { AudioElement } from "@/components/ui/media-audio-node";
import { ImageElement } from "@/components/ui/media-image-node";
import { MediaEmbedElement } from "@/components/ui/media-embed-node";
import { PlaceholderElement } from "@/components/ui/media-placeholder-node";
import { MediaUploadToast } from "@/components/ui/media-upload-toast";
import { VideoElement } from "@/components/ui/media-video-node";
import { MediaToolbarButton } from "@/components/ui/media-toolbar-button";

/**
 * Try to parse a stored string as a Plate Value (JSON array of nodes).
 * Falls back to wrapping plain text in a single paragraph node.
 */
function parseValue(raw: string): Value {
  if (!raw || raw.trim() === "") {
    return [{ type: "p", children: [{ text: "" }] }];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Value;
    }
  } catch {
    // not JSON – treat as plain text
  }
  return [{ type: "p", children: [{ text: raw }] }];
}

/** Serialize a Plate Value to the string stored in `questionText`. */
function serializeValue(value: Value): string {
  return JSON.stringify(value);
}

const editorPlugins = [
  ...BasicNodesKit,
  // Font styling
  FontColorPlugin,
  FontBackgroundColorPlugin,
  FontSizePlugin,
  // Text alignment
  TextAlignPlugin,
  // Classic lists — ListPlugin must be registered first so that
  // editor.getTransforms(ListPlugin) resolves correctly in toolbar hooks.
  ListPlugin,
  BulletedListPlugin.withComponent(BulletedListElement),
  NumberedListPlugin.withComponent(NumberedListElement),
  ListItemPlugin.withComponent(ListItemElement),
  ListItemContentPlugin,
  // Code block with syntax highlighting
  CodeBlockPlugin.withComponent(CodeBlockElement),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
  // Math equations (inline + block)
  InlineEquationPlugin.withComponent(InlineEquationElement),
  EquationPlugin.withComponent(EquationElement),
  // Table
  TablePlugin.configure({
    options: {
      initialTableWidth: 600,
      minColumnWidth: 48,
    },
  }).withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
  // Media (image, video via URL, audio)
  ImagePlugin.withComponent(ImageElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  PlaceholderPlugin.configure({
    options: {
      disableEmptyPlaceholder: true,
      // Only allow image and audio file uploads; video must be inserted via URL
      uploadConfig: {
        audio: {
          maxFileCount: 1,
          maxFileSize: "8MB",
          mediaType: KEYS.audio,
          minFileCount: 1,
        },
        image: {
          maxFileCount: 3,
          maxFileSize: "4MB",
          mediaType: KEYS.img,
          minFileCount: 1,
        },
      },
    },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.mediaEmbed],
      },
    },
  }),
];

interface QuestionEditorProps {
  initialValue: string;
  onUpdate: (value: string) => Promise<void> | void;
  onUpdateError?: (error: Error) => void;
  debounceDelay?: number;
  placeholder?: string;
  className?: string;
}

export function QuestionEditor({
  initialValue,
  onUpdate,
  onUpdateError,
  debounceDelay = 600,
  placeholder,
  className,
}: QuestionEditorProps) {
  const t = useTranslations("Components.editableTextarea");

  const editor = usePlateEditor({
    plugins: editorPlugins,
    value: parseValue(initialValue),
  });

  const latestSerializedRef = useRef<string>(initialValue);

  const initialValueRef = useRef(initialValue);
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const prevInitialRef = useRef(initialValue);
  useEffect(() => {
    if (prevInitialRef.current === initialValue) return;
    prevInitialRef.current = initialValue;
    const currentSerialized = serializeValue(editor.children as Value);
    if (currentSerialized !== initialValue) {
      editor.tf.setValue(parseValue(initialValue));
    }
  }, [initialValue, editor]);

  const isSavingRef = useRef(false);
  const saveValueRef = useRef<(s: string) => Promise<void>>(async () => {});
  useEffect(() => {
    saveValueRef.current = async (serialized: string) => {
      if (isSavingRef.current) return;
      if (serialized === initialValueRef.current) return;
      try {
        isSavingRef.current = true;
        await onUpdate(serialized);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Failed to update question:", err);
        onUpdateError?.(err);
        toast.error(t("saveFailed"));
      } finally {
        isSavingRef.current = false;
      }
    };
  });

  const debouncedSave = useDebouncedCallback((serialized: string) => {
    void saveValueRef.current(serialized);
  }, debounceDelay);

  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      const serialized = serializeValue(value);
      latestSerializedRef.current = serialized;
      debouncedSave(serialized);
    },
    [debouncedSave],
  );

  const handleBlur = useCallback(async () => {
    debouncedSave.flush();
    await saveValueRef.current(latestSerializedRef.current);
  }, [debouncedSave]);

  return (
    <TooltipProvider>
      <Plate editor={editor} onChange={handleChange}>
        <div
          className="rounded-md border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          onBlur={handleBlur}
        >
          <FixedToolbar className="sticky top-0 overflow-x-auto scrollbar-hide rounded-t-md border-b px-1">
            {/* Undo / Redo */}
            <ToolbarGroup>
              <UndoToolbarButton />
              <RedoToolbarButton />
            </ToolbarGroup>

            {/* Font size */}
            <ToolbarGroup>
              <FontSizeToolbarButton />
            </ToolbarGroup>

            {/* Marks */}
            <ToolbarGroup>
              <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
                <BoldIcon />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
                <ItalicIcon />
              </MarkToolbarButton>
              <MarkToolbarButton
                nodeType={KEYS.underline}
                tooltip="Underline (⌘+U)"
              >
                <UnderlineIcon />
              </MarkToolbarButton>
              <MarkToolbarButton
                nodeType={KEYS.strikethrough}
                tooltip="Strikethrough (⌘+⇧+M)"
              >
                <StrikethroughIcon />
              </MarkToolbarButton>
            </ToolbarGroup>

            {/* Text color + background color */}
            <ToolbarGroup>
              <ColorToolbarButton nodeType="color" tooltip="Text color">
                <Type />
              </ColorToolbarButton>
              <ColorToolbarButton
                nodeType="backgroundColor"
                tooltip="Background color"
              >
                <Highlighter />
              </ColorToolbarButton>
            </ToolbarGroup>

            {/* Text alignment */}
            <ToolbarGroup>
              <AlignToolbarButton />
            </ToolbarGroup>

            {/* Lists */}
            <ToolbarGroup>
              <ListToolbarButton nodeType={KEYS.ulClassic} />
              <ListToolbarButton nodeType={KEYS.olClassic} />
            </ToolbarGroup>

            {/* Sub / Super */}
            <ToolbarGroup>
              <MarkToolbarButton
                nodeType={SubscriptPlugin.key}
                tooltip="Subscript (⌘+,)"
              >
                <SubscriptIcon />
              </MarkToolbarButton>
              <MarkToolbarButton
                nodeType={SuperscriptPlugin.key}
                tooltip="Superscript (⌘+.)"
              >
                <SuperscriptIcon />
              </MarkToolbarButton>
            </ToolbarGroup>

            {/* Inline code + Equation */}
            <ToolbarGroup>
              <MarkToolbarButton
                nodeType={KEYS.code}
                tooltip="Inline code (⌘+E)"
              >
                <CodeIcon />
              </MarkToolbarButton>
              <InlineEquationToolbarButton />
            </ToolbarGroup>

            {/* Code block */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => toggleCodeBlock(editor)}
                tooltip="Code block"
              >
                <BracketsIcon />
              </ToolbarButton>
            </ToolbarGroup>

            {/* Table */}
            <ToolbarGroup>
              <TableToolbarButton />
            </ToolbarGroup>

            {/* Media */}
            <ToolbarGroup>
              <MediaToolbarButton nodeType={KEYS.img} />
              <MediaToolbarButton nodeType={KEYS.video} />
              <MediaToolbarButton nodeType={KEYS.audio} />
            </ToolbarGroup>
          </FixedToolbar>

          {/* Floating toolbar on text selection */}
          <FloatingToolbar>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold">
              <BoldIcon />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic">
              <ItalicIcon />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline">
              <UnderlineIcon />
            </MarkToolbarButton>
            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.code} tooltip="Inline code">
              <CodeIcon />
            </MarkToolbarButton>
            <ToolbarSeparator />
            <InlineEquationToolbarButton />
          </FloatingToolbar>

          <EditorContainer
            className={["min-h-24", className].filter(Boolean).join(" ")}
          >
            <Editor placeholder={placeholder} variant="default" />
          </EditorContainer>
        </div>
      </Plate>
    </TooltipProvider>
  );
}
