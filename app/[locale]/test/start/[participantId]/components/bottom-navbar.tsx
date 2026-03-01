"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, List, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BottomNavbarProps {
  /** Whether there is a previous question to navigate to. */
  hasPrev: boolean;
  /** Whether the current question is the last one. */
  isLast: boolean;
  /**
   * Whether any answer API call is still in-flight.
   * When true, the finish-confirm button is disabled.
   */
  isPending: boolean;
  /** Whether the question list sidebar/panel is currently open. */
  isQuestionListOpen: boolean;
  /** Whether the current question is marked. */
  isMarked: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Toggle the question list sidebar/panel. */
  onToggleQuestionList: () => void;
  /** Toggle the marked state of the current question. */
  onToggleMark: () => void;
}

/**
 * Sticky bottom navigation bar.
 * - Shows Previous and Next buttons on left/right.
 * - Center section has a Question List toggle and a Mark button.
 * - On the last question, Next becomes a Finish button that opens a
 *   confirmation dialog. The confirm button is disabled while any background
 *   save is still in-flight (isPending).
 */
export function BottomNavbar({
  hasPrev,
  isLast,
  isPending,
  isQuestionListOpen,
  isMarked,
  onPrev,
  onNext,
  onToggleQuestionList,
  onToggleMark,
}: BottomNavbarProps) {
  const t = useTranslations("Pages.testStart");
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <nav
        aria-label="Question navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
      >
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Previous */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onPrev}
                disabled={!hasPrev}
                aria-label={t("prev")}
              >
                <ChevronLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("prev")}</TooltipContent>
          </Tooltip>

          {/* Center: Question List toggle + Mark */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isQuestionListOpen ? "default" : "outline"}
                  size="icon"
                  onClick={onToggleQuestionList}
                  aria-label={t("questionList")}
                  aria-expanded={isQuestionListOpen}
                >
                  <List />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{t("questionList")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMarked ? "default" : "outline"}
                  size="icon"
                  onClick={onToggleMark}
                  aria-label={isMarked ? t("marked") : t("mark")}
                  aria-pressed={isMarked}
                  className={
                    isMarked
                      ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                      : ""
                  }
                >
                  <Flag />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isMarked ? t("marked") : t("mark")}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Next or Finish */}
          {isLast ? (
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button aria-label={t("finish")} className="bg-green-500">
                  {t("finish")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("finishDialogTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("finishDialogDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("goBack")}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isPending}
                    onClick={(e) => {
                      if (isPending) {
                        e.preventDefault();
                        return;
                      }
                      // TODO: submit test
                    }}
                  >
                    {t("confirmFinish")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" onClick={onNext} aria-label={t("next")}>
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{t("next")}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </nav>
    </TooltipProvider>
  );
}
