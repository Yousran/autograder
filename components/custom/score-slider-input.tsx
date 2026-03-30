"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

/**
 * Answer type discriminator for routing to correct API endpoint.
 * Used to determine which endpoint to PATCH: /api/answer/essay, /api/answer/choice, or /api/answer/multiple-choice
 */
export type AnswerType = "essay" | "choice" | "multiple-choice";

/**
 * Optimistic score slider for test creators.
 * Immediately reflects changes in the UI and debounces the PATCH request.
 * Rolls back on failure.
 */
export function ScoreSliderInput({
  answerId,
  answerType,
  initialScore,
  maxScore,
  extraPatchFields,
}: {
  answerId: string;
  answerType: AnswerType;
  initialScore: number;
  maxScore: number;
  /** Extra fields to include in the PATCH body alongside `score` (e.g. for essay). */
  extraPatchFields?: Record<string, unknown>;
}) {
  const t = useTranslations("Components.scoreSliderInput");
  const [score, setScore] = useState(initialScore);
  const [isSaving, setIsSaving] = useState(false);
  const [debouncedScore] = useDebounce(score, 500);

  // Sync with server-side initial value changes
  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

  const saveScore = useCallback(
    async (newScore: number) => {
      try {
        setIsSaving(true);
        const res = await fetch(`/api/answer/${answerType}/${answerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: newScore, ...extraPatchFields }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Failed to update score");
        }
      } catch (err) {
        // Roll back on failure
        setScore(initialScore);
        const msg = err instanceof Error ? err.message : t("updateFailed");
        toast.error(msg);
      } finally {
        setIsSaving(false);
      }
    },
    [answerId, answerType, initialScore, extraPatchFields, t],
  );

  // Keep a stable ref to avoid stale closure issues
  const saveScoreRef = useRef(saveScore);
  useEffect(() => {
    saveScoreRef.current = saveScore;
  });

  // Auto-save when debounced value changes
  useEffect(() => {
    if (debouncedScore !== initialScore) {
      saveScoreRef.current(debouncedScore);
    }
  }, [debouncedScore, initialScore]);

  return (
    <div className="flex items-center gap-3">
      <Slider
        value={[score]}
        onValueChange={([val]) => setScore(val ?? 0)}
        min={0}
        max={maxScore}
        step={1}
        disabled={isSaving}
        className="flex-1"
        aria-label={t("score")}
      />
      <div className="flex items-center gap-2 shrink-0 min-w-16">
        {isSaving && <Spinner className="size-3" />}
        <Badge variant="outline" className="tabular-nums justify-center">
          {score} / {maxScore}
        </Badge>
      </div>
    </div>
  );
}
