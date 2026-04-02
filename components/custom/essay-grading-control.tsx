"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ScoreSliderInput } from "./score-slider-input";

/**
 * Combined score slider + explanation textarea for essay grading.
 * Uses ScoreSliderInput for score management.
 * Explanation textarea calls PATCH /api/answer/essay/[answerId] independently.
 * Each update is optimistic and rolls back on failure.
 */
export function EssayGradingControl({
  answerId,
  initialScore,
  maxScore,
  initialScoreExplanation,
}: {
  answerId: string;
  initialScore: number;
  maxScore: number;
  initialScoreExplanation: string | null;
}) {
  const t = useTranslations();
  const [explanation, setExplanation] = useState(initialScoreExplanation ?? "");
  const [isSavingExplanation, setIsSavingExplanation] = useState(false);

  const [debouncedExplanation] = useDebounce(explanation, 700);
  useEffect(() => {
    setExplanation(initialScoreExplanation ?? "");
  }, [initialScoreExplanation]);

  const patchAnswer = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/answer/essay/${answerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          data.error ?? t("Components.essayGradingControl.updateFailed"),
        );
      }
    },
    [answerId, t],
  );

  // --- Explanation saving ---
  const saveExplanation = useCallback(
    async (newExplanation: string) => {
      try {
        setIsSavingExplanation(true);
        await patchAnswer({ scoreExplanation: newExplanation || null });
      } catch (err) {
        setExplanation(initialScoreExplanation ?? "");
        toast.error(
          err instanceof Error
            ? err.message
            : t("Components.essayGradingControl.updateFailed"),
        );
      } finally {
        setIsSavingExplanation(false);
      }
    },
    [initialScoreExplanation, patchAnswer, t],
  );

  const saveExplanationRef = useRef(saveExplanation);
  useEffect(() => {
    saveExplanationRef.current = saveExplanation;
  });
  useEffect(() => {
    if (debouncedExplanation !== (initialScoreExplanation ?? "")) {
      saveExplanationRef.current(debouncedExplanation);
    }
  }, [debouncedExplanation, initialScoreExplanation]);

  return (
    <div className="flex flex-col gap-3">
      {/* Score slider */}
      <ScoreSliderInput
        answerId={answerId}
        answerType="essay"
        initialScore={initialScore}
        maxScore={maxScore}
      />

      {/* Score explanation textarea */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {isSavingExplanation && <Spinner className="size-3" />}
          <Label className="text-xs text-muted-foreground">
            {t("Components.essayGradingControl.explanation")}
          </Label>
        </div>
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder={t(
            "Components.essayGradingControl.explanationPlaceholder",
          )}
          disabled={isSavingExplanation}
          rows={2}
          className="resize-none text-sm"
        />
      </div>
    </div>
  );
}
