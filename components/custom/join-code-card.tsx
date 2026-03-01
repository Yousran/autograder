"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Copy, Check, QrCode, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const locale = useLocale();
  const code = initialCode;
  const expiresAt = initialExpiresAt;
  const [now] = useState<number>(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isExpired = expiresAt !== null && expiresAt.getTime() <= now;
  const hasActiveCode = code !== null && !isExpired;

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getJoinUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/${locale}/join?code=${code}`;
  };

  const downloadQR = () => {
    const qrElement = document.querySelector(
      '[data-testid="qr-code"]',
    ) as HTMLCanvasElement;
    if (!qrElement) return;

    const url = qrElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `join-code-${code}.png`;
    link.click();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {/* Main pill */}
        <div className="relative flex items-center min-h-20 bg-muted text-foreground rounded-xl px-3 py-3">
          {/* QR Code icon - left */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQR(true)}
                disabled={!hasActiveCode}
              >
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

        {/* QR Code Dialog */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("qrCode")}</DialogTitle>
              {code && (
                <DialogDescription>
                  {t("qrCodeDescription", { code })}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeCanvas
                  value={getJoinUrl()}
                  data-testid="qr-code"
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQR}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("download")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
