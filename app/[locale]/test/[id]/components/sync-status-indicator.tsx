"use client";

import { cn } from "@/lib/utils";
import { CloudCheck, CloudOff, CloudUpload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSync } from "../context/sync-context";

export function SyncStatusIndicator({
  showLabel = true,
  ...props
}: {
  showLabel?: boolean;
}) {
  const t = useTranslations();
  const { saving, saved, error } = useSync();

  // Determine status based on sync state
  const status: "syncing" | "synced" | "error" | null = saving
    ? "syncing"
    : error
      ? "error"
      : saved
        ? "synced"
        : null;

  if (!status) return null;

  const statusConfig = {
    syncing: {
      icon: <CloudUpload className="animate-pulse" />,
      label: t("Components.syncStatus.saving"),
      className: "text-blue-500",
    },
    synced: {
      icon: <CloudCheck />,
      label: t("Components.syncStatus.saved"),
      className: "text-green-500",
    },
    error: {
      icon: <CloudOff />,
      label: t("Components.syncStatus.error"),
      className: "text-destructive",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity duration-200",
        config.className,
      )}
      {...props}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
