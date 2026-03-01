"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";

interface JoinCodeCardProps {
  initialCode: string | null;
  initialExpiresAt: Date | null;
}

function formatExpiry(expiresAt: Date | null, now: number): string {
  if (!expiresAt) return "";
  const diffMs = expiresAt.getTime() - now;
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
  initialCode,
  initialExpiresAt,
}: JoinCodeCardProps) {
  const t = useTranslations("Components.joinCode");
  const code = initialCode;
  const expiresAt = initialExpiresAt;
  const [now] = useState<number>(() => Date.now());
  const [copied, setCopied] = useState(false);

  const isExpired = expiresAt !== null && expiresAt.getTime() <= now;
  const hasActiveCode = code !== null && !isExpired;

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
        <div className="relative flex items-center min-h-20 bg-muted text-foreground rounded-xl px-3 py-3">
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
          <div className="flex flex-1 justify-center pointer-events-none select-none">
            {hasActiveCode ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label className="text-5xl font-bold font-sans select-all pointer-events-auto cursor-default">
                    {code}
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  {t("expiresIn", { time: formatExpiry(expiresAt, now) })}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-5xl font-bold text-muted-foreground select-none">
                {isExpired ? t("expired") : "------"}
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
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
