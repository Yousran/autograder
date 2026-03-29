"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface EssayGradingControlProps {
  answerId: string;
  initialScore: number;
  maxScore: number;
  initialScoreExplanation: string | null;
}

/**
 * Combined score slider + explanation textarea for essay grading.
 * Both fields call PATCH /api/answer/essay/[answerId] independently.
 * Each update is optimistic and rolls back on failure.
 */
export function EssayGradingControl({
  answerId,
  initialScore,
  maxScore,
  initialScoreExplanation,
}: EssayGradingControlProps) {
  const t = useTranslations("Components.essayGradingControl");
  const [score, setScore] = useState(initialScore);
  const [explanation, setExplanation] = useState(initialScoreExplanation ?? "");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [isSavingExplanation, setIsSavingExplanation] = useState(false);

  const [debouncedScore] = useDebounce(score, 500);
  const [debouncedExplanation] = useDebounce(explanation, 700);

  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

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
        throw new Error(data.error ?? t("updateFailed"));
      }
    },
    [answerId, t],
  );

  // --- Score saving ---
  const saveScore = useCallback(
    async (newScore: number) => {
      try {
        setIsSavingScore(true);
        await patchAnswer({ score: newScore });
      } catch (err) {
        setScore(initialScore);
        toast.error(err instanceof Error ? err.message : t("updateFailed"));
      } finally {
        setIsSavingScore(false);
      }
    },
    [initialScore, patchAnswer, t],
  );

  const saveScoreRef = useRef(saveScore);
  useEffect(() => {
    saveScoreRef.current = saveScore;
  });
  useEffect(() => {
    if (debouncedScore !== initialScore) {
      saveScoreRef.current(debouncedScore);
    }
  }, [debouncedScore, initialScore]);

  // --- Explanation saving ---
  const saveExplanation = useCallback(
    async (newExplanation: string) => {
      try {
        setIsSavingExplanation(true);
        await patchAnswer({ scoreExplanation: newExplanation || null });
      } catch (err) {
        setExplanation(initialScoreExplanation ?? "");
        toast.error(err instanceof Error ? err.message : t("updateFailed"));
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
      <div className="flex items-center gap-3">
        <Slider
          value={[score]}
          onValueChange={([val]) => setScore(val ?? 0)}
          min={0}
          max={maxScore}
          step={1}
          disabled={isSavingScore}
          className="flex-1"
          aria-label={t("score")}
        />
        <div className="flex items-center gap-2 shrink-0 min-w-16">
          {isSavingScore && <Spinner className="size-3" />}
          <Badge variant="outline" className="tabular-nums justify-center">
            {score} / {maxScore}
          </Badge>
        </div>
      </div>

      {/* Score explanation textarea */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {isSavingExplanation && <Spinner className="size-3" />}
          <Label className="text-xs text-muted-foreground">
            {t("explanation")}
          </Label>
        </div>
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder={t("explanationPlaceholder")}
          disabled={isSavingExplanation}
          rows={2}
          className="resize-none text-sm"
        />
      </div>
    </div>
  );
}
