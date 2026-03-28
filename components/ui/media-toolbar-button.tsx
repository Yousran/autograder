"use client";

import * as React from "react";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";

import { PlaceholderPlugin } from "@platejs/media/react";
import { AudioLinesIcon, FilmIcon, ImageIcon, LinkIcon } from "lucide-react";
import { isUrl, KEYS } from "platejs";
import { useEditorRef } from "platejs/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import {
  ToolbarButton,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from "./toolbar";

const MEDIA_CONFIG: Record<
  string,
  {
    accept: string[];
    icon: React.ReactNode;
    titleKey: string;
    tooltipKey: string;
    /** When true, skip file upload entirely and open the URL dialog directly */
    urlOnly?: boolean;
  }
> = {
  [KEYS.audio]: {
    accept: ["audio/*"],
    icon: <AudioLinesIcon className="size-4" />,
    titleKey: "insertAudio",
    tooltipKey: "audio",
  },
  [KEYS.img]: {
    accept: ["image/*"],
    icon: <ImageIcon className="size-4" />,
    titleKey: "insertImage",
    tooltipKey: "image",
  },
  [KEYS.video]: {
    accept: [],
    icon: <FilmIcon className="size-4" />,
    titleKey: "insertVideo",
    tooltipKey: "insertVideoUrl",
    urlOnly: true,
  },
};

export function MediaToolbarButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: string }) {
  const t = useTranslations("Components.editor");
  const currentConfig = MEDIA_CONFIG[nodeType];

  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { openFilePicker } = useFilePicker({
    accept: currentConfig.urlOnly ? ["*"] : currentConfig.accept,
    multiple: true,
    onFilesSelected: ({ plainFiles: updatedFiles }) => {
      editor.getTransforms(PlaceholderPlugin).insert.media(updatedFiles);
    },
  });

  // URL-only nodes (e.g. video): render a plain button that opens the URL dialog
  if (currentConfig.urlOnly) {
    return (
      <>
        <ToolbarButton
          onClick={() => setDialogOpen(true)}
          tooltip={t(currentConfig.tooltipKey)}
        >
          {currentConfig.icon}
        </ToolbarButton>

        <AlertDialog
          onOpenChange={(value) => setDialogOpen(value)}
          open={dialogOpen}
        >
          <AlertDialogContent className="gap-6">
            <MediaUrlDialogContent
              currentConfig={currentConfig}
              nodeType={nodeType}
              setOpen={setDialogOpen}
            />
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <ToolbarSplitButton
        onClick={() => {
          openFilePicker();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        pressed={open}
        tooltip={t(currentConfig.tooltipKey)}
      >
        <ToolbarSplitButtonPrimary>
          {currentConfig.icon}
        </ToolbarSplitButtonPrimary>

        <DropdownMenu
          modal={false}
          onOpenChange={setOpen}
          open={open}
          {...props}
        >
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            alignOffset={-32}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openFilePicker()}>
                {currentConfig.icon}
                {t("uploadFromComputer")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LinkIcon />
                {t("insertViaUrl")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>

      <AlertDialog
        onOpenChange={(value) => {
          setDialogOpen(value);
        }}
        open={dialogOpen}
      >
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaUrlDialogContent({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: (typeof MEDIA_CONFIG)[string];
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const t = useTranslations("Components.editor");
  const editor = useEditorRef();
  const [url, setUrl] = React.useState("");

  const embedMedia = React.useCallback(() => {
    if (!isUrl(url)) return toast.error(t("invalidUrl"));

    setOpen(false);
    editor.tf.insertNodes({
      children: [{ text: "" }],
      type: nodeType,
      url,
    });
  }, [url, editor, nodeType, setOpen, t]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{t(currentConfig.titleKey)}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="-translate-y-1/2 absolute top-1/2 block cursor-text px-1 text-muted-foreground/70 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium group-focus-within:text-foreground group-focus-within:text-xs has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:text-xs"
          htmlFor="url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          autoFocus
          className="w-full"
          id="url"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") embedMedia();
          }}
          placeholder=""
          type="url"
          value={url}
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          {t("accept")}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
