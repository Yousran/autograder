"use client";

import { useEffect } from "react";
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
import {
  BulletedListPlugin,
  ListItemContentPlugin,
  ListItemPlugin,
  ListPlugin,
  NumberedListPlugin,
} from "@platejs/list-classic/react";
import { EquationPlugin, InlineEquationPlugin } from "@platejs/math/react";
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
  VideoPlugin,
} from "@platejs/media/react";
import { CaptionPlugin } from "@platejs/caption/react";
import { KEYS } from "platejs";

import { cn } from "@/lib/utils";
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
import {
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from "@/components/ui/table-node";
import { AudioElement } from "@/components/ui/media-audio-node";
import { ImageElement } from "@/components/ui/media-image-node";
import { MediaEmbedElement } from "@/components/ui/media-embed-node";
import { VideoElement } from "@/components/ui/media-video-node";
import { Editor, EditorContainer } from "@/components/ui/editor";

/**
 * Parse a stored Plate JSON string into a Value array.
 * Falls back to a single paragraph wrapping raw text on failure.
 */
function parseValue(raw: string): Value {
  if (!raw || raw.trim() === "") {
    return [{ type: "p", children: [{ text: "" }] }];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Value;
    }
  } catch {
    // not JSON — treat as plain text
  }
  return [{ type: "p", children: [{ text: raw }] }];
}

const viewerPlugins = [
  ...BasicNodesKit,
  // Font styling
  FontColorPlugin,
  FontBackgroundColorPlugin,
  FontSizePlugin,
  // Text alignment
  TextAlignPlugin,
  // Classic lists
  ListPlugin,
  BulletedListPlugin.withComponent(BulletedListElement),
  NumberedListPlugin.withComponent(NumberedListElement),
  ListItemPlugin.withComponent(ListItemElement),
  ListItemContentPlugin,
  // Code blocks
  CodeBlockPlugin.withComponent(CodeBlockElement),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
  // Math equations
  InlineEquationPlugin.withComponent(InlineEquationElement),
  EquationPlugin.withComponent(EquationElement),
  // Tables
  TablePlugin.withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
  // Media
  ImagePlugin.withComponent(ImageElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  CaptionPlugin.configure({
    options: {
      query: { allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.mediaEmbed] },
    },
  }),
];

/**
 * Renders Plate-serialised rich-text content in read-only mode.
 * Automatically converts legacy HTML content to Plate format.
 * Use this wherever questionText or choiceText needs to be displayed.
 */
export function PlateReadOnlyViewer({
  value,
  className,
}: {
  /** Serialised Plate JSON string as stored in the database. */
  value: string;
  className?: string;
}) {
  const editor = usePlateEditor({
    plugins: viewerPlugins,
    value: parseValue(value),
  });

  // Handle HTML content conversion on initial mount
  useEffect(() => {
    // Detect if it looks like HTML content
    const isHtml = /^<\s*\/?\s*([a-z][a-z0-9]*)[^>]*>/i.test(value);

    if (isHtml) {
      try {
        // Use Plate's HTML deserializer to convert HTML to Plate format
        const plateValue = editor.api.html.deserialize({ element: value });
        if (Array.isArray(plateValue) && plateValue.length > 0) {
          editor.tf.setValue(plateValue as Value);
        }
      } catch (error) {
        console.warn(
          "Failed to deserialize HTML, keeping as plain text",
          error,
        );
      }
    }
  }, [value, editor.api.html, editor.tf]);

  return (
    <Plate editor={editor}>
      <EditorContainer className="h-fit w-full min-w-0 overflow-x-hidden">
        <Editor
          readOnly
          variant="none"
          className={cn("wrap-break-word", className)}
        />
      </EditorContainer>
    </Plate>
  );
}
