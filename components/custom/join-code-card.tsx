"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, RefreshCw, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";

interface JoinCodeCardProps {
  testId: string;
  initialCode: string | null;
  initialExpiresAt: Date | null;
}

function formatExpiry(expiresAt: Date | null): string {
  if (!expiresAt) return "";
  const diffMs = expiresAt.getTime() - Date.now();
  if (diffMs <= 0) return "expired";
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
  return `${diffMins}m`;
}

export function JoinCodeCard({
  testId,
  initialCode,
  initialExpiresAt,
}: JoinCodeCardProps) {
  const t = useTranslations("Components.joinCode");
  const [code, setCode] = useState<string | null>(initialCode);
  const [expiresAt, setExpiresAt] = useState<Date | null>(initialExpiresAt);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isExpired = expiresAt !== null && expiresAt.getTime() <= Date.now();
  const hasActiveCode = code !== null && !isExpired;

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tests/${testId}/join-code`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? t("generateFailed"));
        return;
      }
      const data = await res.json();
      setCode(data.joinCode);
      setExpiresAt(
        data.joinCodeExpiresAt ? new Date(data.joinCodeExpiresAt) : null,
      );
      toast.success(t("generateSuccess"));
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {/* Main pill */}
        <div className="relative flex items-center min-h-20 bg-foreground/10 text-foreground rounded-xl px-3 py-3">
          {/* QR Code icon - left */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <QrCode />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("qrCode")}</TooltipContent>
          </Tooltip>

          {/* Code - absolutely centered, independent of buttons */}
          <div className="absolute inset-0 flex justify-center pointer-events-none select-none">
            {hasActiveCode ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label className="text-5xl font-bold text-center align-middle select-all pointer-events-auto cursor-default">
                    {code}
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  {t("expiresIn", { time: formatExpiry(expiresAt) })}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-5xl font-bold text-muted-foreground select-none">
                {isExpired ? t("expired") : "------"}
              </span>
            )}
          </div>
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Regenerate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={generate}
                  disabled={generating}
                  className="text-foreground hover:text-foreground hover:bg-foreground/10"
                >
                  {generating ? (
                    <Spinner className="text-foreground/70" />
                  ) : (
                    <RefreshCw />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("regenerate")}</TooltipContent>
            </Tooltip>

            {/* Copy */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copy}
                  disabled={!hasActiveCode}
                  className={cn(
                    "text-foreground/70 hover:text-foreground hover:bg-foreground/10",
                    copied && "text-green-400 hover:text-green-400",
                  )}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("copy")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
