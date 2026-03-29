"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, List, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  onSaveBeforeDialog,
  onFinish,
}: {
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
  /**
   * Called when the Finish button is clicked (before the dialog opens).
   * Use this to fire-and-forget save the current answer so isPending reflects
   * the in-flight state and gates the confirm button inside the dialog.
   */
  onSaveBeforeDialog: () => void;
  /** Called when the user confirms finishing the test. */
  onFinish: () => void;
}) {
  const t = useTranslations("Pages.testStart");
  const [open, setOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

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
                data-testid="btn-previous"
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
                  data-testid="btn-question-list"
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
                  data-testid="btn-mark"
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
            <AlertDialog
              open={open}
              onOpenChange={(newOpen) => {
                if (isFinishing) return;
                setOpen(newOpen);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button
                  aria-label={t("finish")}
                  className="bg-green-500"
                  onClick={onSaveBeforeDialog}
                  disabled={isFinishing}
                  data-testid="btn-finish"
                >
                  {isFinishing ? <Spinner /> : t("finish")}
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
                  <AlertDialogCancel disabled={isFinishing}>
                    {t("goBack")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isPending || isFinishing}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsFinishing(true);
                      void onFinish();
                    }}
                  >
                    {isPending || isFinishing ? (
                      <Spinner />
                    ) : (
                      t("confirmFinish")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={onNext}
                  aria-label={t("next")}
                  data-testid="btn-next"
                >
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
