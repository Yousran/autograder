"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow, isPast } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
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

export function JoinCodeCard({
  initialCode,
  initialExpiresAt,
}: {
  initialCode: string | null;
  initialExpiresAt: Date | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = locale === "id" ? idLocale : enUS;
  const code = initialCode;
  const expiresAt = initialExpiresAt;
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isExpired = expiresAt !== null && isPast(expiresAt);
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
            <TooltipContent>{t("Components.joinCode.qrCode")}</TooltipContent>
          </Tooltip>

          {/* Code - absolutely centered, independent of buttons */}
          <div className="flex flex-1 justify-center pointer-events-none select-none">
            {hasActiveCode ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label
                    className="text-5xl font-bold font-sans select-all pointer-events-auto cursor-default"
                    data-testid="join-code-display"
                  >
                    {code}
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  {t("Components.joinCode.expiresIn", {
                    time: formatDistanceToNow(expiresAt!, {
                      locale: dateFnsLocale,
                    }),
                  })}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-5xl font-bold text-muted-foreground select-none">
                {isExpired ? t("Components.joinCode.expired") : "------"}
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
              <TooltipContent>{t("Components.joinCode.copy")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* QR Code Dialog */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("Components.joinCode.qrCode")}</DialogTitle>
              {code && (
                <DialogDescription>
                  {t("Components.joinCode.qrCodeDescription", { code })}
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
                {t("Components.joinCode.download")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
