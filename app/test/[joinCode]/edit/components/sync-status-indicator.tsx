"use client";

import { cn } from "@/lib/utils";
import { Cloud, CloudCheck, CloudOff, CloudUpload } from "lucide-react";
import { SyncStatus } from "../context/optimistic-context";

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  className?: string;
  showLabel?: boolean;
}

export function SyncStatusIndicator({
  status,
  className,
  showLabel = true,
}: SyncStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      icon: <Cloud className="h-4 w-4" />,
      label: "Idle",
      className: "text-muted-foreground",
    },
    syncing: {
      icon: <CloudUpload className="h-4 w-4 animate-pulse" />,
      label: "Saving...",
      className: "text-blue-500",
    },
    synced: {
      icon: <CloudCheck className="h-4 w-4" />,
      label: "Saved",
      className: "text-green-500",
    },
    error: {
      icon: <CloudOff className="h-4 w-4" />,
      label: "Error saving",
      className: "text-destructive",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity duration-200",
        config.className,
        className
      )}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
