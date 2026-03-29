"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { SettingsMenu } from "@/components/custom/settings-menu";
import { Badge } from "@/components/ui/badge";

/** Formats seconds into mm:ss or hh:mm:ss. */
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  if (h > 0) {
    const hh = String(h).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Top sticky navbar displayed during a test.
 * Shows the test title, optional countdown timer, and settings.
 */
export function NavbarTest({
  testTitle,
  secondsRemaining,
}: {
  testTitle: string;
  /** Remaining seconds for the countdown. Null means no time limit. */
  secondsRemaining: number | null;
}) {
  const t = useTranslations("Pages.testStart");
  const isWarning =
    secondsRemaining != null && secondsRemaining > 0 && secondsRemaining <= 300;
  const isExpired = secondsRemaining != null && secondsRemaining <= 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Title */}
        <h1 className="truncate text-sm font-semibold md:text-base">
          {testTitle}
        </h1>

        {/* Countdown + Settings */}
        <div className="flex items-center gap-3">
          {secondsRemaining != null && (
            <Badge
              variant={
                isExpired
                  ? "destructive"
                  : isWarning
                    ? "destructive"
                    : "secondary"
              }
              className={`flex items-center gap-1 font-mono text-sm ${
                isWarning && !isExpired ? "animate-pulse" : ""
              }`}
              aria-label={t("timeRemaining")}
              aria-live="polite"
            >
              <Clock aria-hidden="true" />
              {isExpired ? t("timeUp") : formatTime(secondsRemaining)}
            </Badge>
          )}
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
