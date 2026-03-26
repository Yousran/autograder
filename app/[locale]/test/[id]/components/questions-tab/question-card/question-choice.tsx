"use client";

import { useEffect, useState } from "react";
import { ChoiceItem } from "@/components/custom/choice-item";
import ChoiceSkeleton from "./choice-skeleton";
import { Check, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ChoiceSchema,
  defaultChoiceData,
  type ChoiceSchema as ChoiceSchemaType,
} from "@/lib/schemas/choice";
import { Label } from "@/components/ui/label";
import { IsChoiceRandomizedToggle } from "./is-choice-randomized-toggle";
import { MaxScoreEditable } from "./max-score-editable";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  ChoiceEditor,
  getChoiceEditorPlainText,
} from "@/components/custom/choice-editor";

interface QuestionChoiceProps {
  questionId: string;
  isChoiceRandomized?: boolean;
  maxScore?: number;
}

export function QuestionChoice({
  questionId,
  isChoiceRandomized = false,
  maxScore = 1,
}: QuestionChoiceProps) {
  const t = useTranslations("Components.questionsTab");
  const tValidation = useTranslations("Validation");
  const [choices, setChoices] = useState<ChoiceSchemaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch choices based on question
  useEffect(() => {
    // Skip fetching if questionId is temporary (not yet created on server)
    if (questionId.startsWith("temp-")) {
      setIsLoading(false);
      return;
    }

    const fetchChoices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/choices?questionid=${encodeURIComponent(questionId)}`,
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t("fetchFailed"));
        }

        const data = await response.json();
        const validatedChoices = data.map((choice: unknown) =>
          ChoiceSchema.parse(choice),
        );
        setChoices(validatedChoices);
      } catch (err) {
        console.error("Error fetching choices:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch choices",
        );
      }
      setIsLoading(false);
    };

    fetchChoices();
  }, [questionId, t]);

  const handleCreateChoice = async () => {
    try {
      // Optimistically add choice using default data. If there's no existing
      // correct choice, mark the optimistic one as correct so UI matches server.
      const hasCorrect = choices.some((c) => c.isCorrect);
      const optimisticChoice = {
        ...defaultChoiceData,
        questionId,
        isCorrect: !hasCorrect,
      };
      setChoices((prev) => [...prev, optimisticChoice]);

      // Create on server
      const response = await fetch(
        `/api/choices/create?questionid=${encodeURIComponent(questionId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create choice");
      }

      const { choice } = await response.json();
      const validatedChoice = ChoiceSchema.parse(choice);

      // Replace optimistic choice with real one
      setChoices((prev) =>
        prev.map((c) => (c.id === optimisticChoice.id ? validatedChoice : c)),
      );
    } catch (err) {
      console.error("Error creating choice:", err);
      // Remove optimistic choice on error
      setChoices((prev) => prev.filter((c) => !c.id.startsWith("temp-")));
      setError(err instanceof Error ? err.message : "Failed to create choice");
    }
  };

  const handleMarkCorrect = async (choiceId: string) => {
    const previous = choices;

    // Optimistically mark selected as correct and others as false
    setChoices((prev) =>
      prev.map((c) => ({ ...c, isCorrect: c.id === choiceId })),
    );

    // Temp choices aren't persisted yet — skip the server call
    if (choiceId.startsWith("temp-")) return;

    try {
      const response = await fetch(
        `/api/choices/${encodeURIComponent(choiceId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCorrect: true }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update choice");
      }

      const res = await response.json();
      const updated = ChoiceSchema.parse(
        res.choice ?? res.multipleSelectChoice ?? res,
      );

      // Replace updated choice and ensure single true
      setChoices((prev) =>
        prev.map((c) =>
          c.id === updated.id
            ? updated
            : { ...c, isCorrect: c.id === updated.id },
        ),
      );
    } catch (err) {
      console.error("Error updating choice:", err);
      setChoices(previous);
      setError(err instanceof Error ? err.message : "Failed to update choice");
    }
  };

  const handleDeleteChoice = async (choiceId: string) => {
    // Prevent deleting optimistic/temp choices on server
    if (choiceId.startsWith("temp-")) {
      setChoices((prev) => prev.filter((c) => c.id !== choiceId));
      return;
    }

    // Client-side guard: prevent deleting a correct choice or when only two persisted choices remain
    const target = choices.find((c) => c.id === choiceId);
    const persistedCount = choices.filter(
      (c) => !c.id.startsWith("temp-"),
    ).length;
    if (!target) return;
    if (target.isCorrect) {
      setError(t("cannotDeleteCorrect") || "Cannot delete correct choice");
      return;
    }
    if (persistedCount <= 2) {
      setError(
        t("cannotDeleteMinChoices") || "At least two choices are required",
      );
      return;
    }

    const previous = choices;

    // Optimistically remove the choice from UI
    setChoices((prev) => prev.filter((c) => c.id !== choiceId));

    try {
      const response = await fetch(
        `/api/choices/${encodeURIComponent(choiceId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete choice");
      }
    } catch (err) {
      console.error("Error deleting choice:", err);
      setChoices(previous);
      setError(err instanceof Error ? err.message : "Failed to delete choice");
    }
  };

  const handleChoiceTextUpdate = async (choiceId: string, value: string) => {
    if (!getChoiceEditorPlainText(value).trim()) {
      throw new Error(tValidation("choiceTextRequired"));
    }

    const res = await fetch(`/api/choices/${encodeURIComponent(choiceId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choiceText: value }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || t("updateFailed"));
    }
  };

  if (isLoading) {
    return <ChoiceSkeleton />;
  }

  if (error) {
    return (
      <div>
        <ChoiceItem>
          <p className="text-red-600">{error}</p>
        </ChoiceItem>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-sm font-medium">
              {t("choiceRandomizeLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("choiceRandomizeDescription")}
            </p>
          </div>
          <IsChoiceRandomizedToggle
            questionId={questionId}
            initialValue={isChoiceRandomized}
            questionType={QuestionType.CHOICE}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-sm font-medium">{t("maxScoreLabel")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("maxScoreDescription")}
            </p>
          </div>
          <MaxScoreEditable
            questionId={questionId}
            initialValue={maxScore}
            questionType={QuestionType.CHOICE}
          />
        </div>
      </div>
      {choices.map((choice, index) => (
        <ChoiceItem key={choice.id} value={choice.id} choiceIndex={index}>
          <Button
            variant={choice.isCorrect ? "default" : "outline"}
            size="icon"
            onClick={() => handleMarkCorrect(choice.id)}
            aria-label={
              choice.isCorrect ? t("markedCorrect") : t("markCorrect")
            }
          >
            <Check />
          </Button>
          <ChoiceEditor
            initialValue={choice.choiceText || ""}
            onUpdate={(value) => handleChoiceTextUpdate(choice.id, value)}
            placeholder={t("choiceTextPlaceholder")}
            onUpdateError={(error) => {
              console.error("Failed to update choice text:", error);
            }}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDeleteChoice(choice.id)}
            aria-label={t("deleteChoice")}
            disabled={
              choice.isCorrect ||
              choices.filter((c) => !c.id.startsWith("temp-")).length <= 2
            }
            title={
              choice.isCorrect
                ? t("cannotDeleteCorrect")
                : choices.filter((c) => !c.id.startsWith("temp-")).length <= 2
                  ? t("cannotDeleteMinChoices")
                  : undefined
            }
          >
            <Trash />
          </Button>
        </ChoiceItem>
      ))}
      <Button onClick={handleCreateChoice}>{t("addChoice")}</Button>
    </div>
  );
}
