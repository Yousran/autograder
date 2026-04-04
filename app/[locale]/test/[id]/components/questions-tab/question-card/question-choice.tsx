"use client";

import { useEffect, useState } from "react";
import { ChoiceItem } from "@/components/custom/choice-item";
import ChoiceSkeleton from "@/components/custom/skeletons/choice-skeleton";
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
import { Button } from "@/components/ui/button";
import {
  ChoiceEditor,
  getChoiceEditorPlainText,
} from "@/components/custom/choice-editor";
import { QuestionWithDetails } from "@/lib/schemas/question";
import { useSync } from "../../../context/sync-context";

export function QuestionChoice({
  question,
}: {
  question: QuestionWithDetails;
}) {
  const t = useTranslations();
  const [choices, setChoices] = useState<ChoiceSchemaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingChoices, setUpdatingChoices] = useState<Set<string>>(
    new Set(),
  );
  const { setSaving, setSaved, setError } = useSync();

  // Fetch choices based on question
  useEffect(() => {
    // Skip fetching if questionId is temporary (not yet created on server)
    if (question.id.startsWith("temp-")) {
      setIsLoading(false);
      return;
    }

    const fetchChoices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/choices?questionid=${encodeURIComponent(question.id)}`,
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || t("Components.questionsTab.fetchFailed"),
          );
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
  }, [question.id, setError, t]);

  const handleCreateChoice = async () => {
    try {
      // Optimistically add choice using default data. If there's no existing
      // correct choice, mark the optimistic one as correct so UI matches server.
      const hasCorrect = choices.some((c) => c.isCorrect);
      const optimisticChoice = {
        ...defaultChoiceData,
        questionId: question.id,
        isCorrect: !hasCorrect,
      };
      setChoices((prev) => [...prev, optimisticChoice]);
      setSaving(true);
      setSaved(false);

      // Create on server
      const response = await fetch(
        `/api/choices/create?questionid=${encodeURIComponent(question.id)}`,
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
      setSaved(true);
    } catch (err) {
      console.error("Error creating choice:", err);
      // Remove optimistic choice on error
      setChoices((prev) => prev.filter((c) => !c.id.startsWith("temp-")));
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create choice";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCorrect = async (choiceId: string) => {
    if (updatingChoices.has(choiceId)) return;

    const previous = choices;

    // Optimistically mark selected as correct and others as false
    setChoices((prev) =>
      prev.map((c) => ({ ...c, isCorrect: c.id === choiceId })),
    );
    setUpdatingChoices((prev) => new Set([...prev, choiceId]));
    setSaving(true);
    setSaved(false);

    // Temp choices aren't persisted yet — skip the server call
    if (choiceId.startsWith("temp-")) {
      setUpdatingChoices((prev) => {
        const next = new Set(prev);
        next.delete(choiceId);
        return next;
      });
      setSaving(false);
      setSaved(true);
      return;
    }

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
        const errorMsg = data.error || "Failed to update choice";
        throw new Error(errorMsg);
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
      setSaved(true);
    } catch (err) {
      console.error("Error updating choice:", err);
      setChoices(previous);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update choice";
      setError(errorMsg);
    } finally {
      setUpdatingChoices((prev) => {
        const next = new Set(prev);
        next.delete(choiceId);
        return next;
      });
      setSaving(false);
    }
  };

  const handleDeleteChoice = async (choiceId: string) => {
    if (updatingChoices.has(choiceId)) return;

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
      setError(
        t("Components.questionsTab.cannotDeleteCorrect") ||
          "Cannot delete correct choice",
      );
      return;
    }
    if (persistedCount <= 2) {
      setError(
        t("Components.questionsTab.cannotDeleteMinChoices") ||
          "At least two choices are required",
      );
      return;
    }

    const previous = choices;

    // Optimistically remove the choice from UI
    setChoices((prev) => prev.filter((c) => c.id !== choiceId));
    setUpdatingChoices((prev) => new Set([...prev, choiceId]));
    setSaving(true);
    setSaved(false);

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
      setSaved(true);
    } catch (err) {
      console.error("Error deleting choice:", err);
      setChoices(previous);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete choice";
      setError(errorMsg);
    } finally {
      setUpdatingChoices((prev) => {
        const next = new Set(prev);
        next.delete(choiceId);
        return next;
      });
      setSaving(false);
    }
  };

  const handleChoiceTextUpdate = async (choiceId: string, value: string) => {
    if (!getChoiceEditorPlainText(value).trim()) {
      throw new Error(t("Validation.choiceTextRequired"));
    }

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/choices/${encodeURIComponent(choiceId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choiceText: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update choice text");
      }
      setSaved(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update choice text";
      setError(errorMsg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <ChoiceSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label
              className="text-sm font-medium"
              data-testid="label-choice-randomized"
            >
              {t("Components.questionsTab.choiceRandomizeLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("Components.questionsTab.choiceRandomizeDescription")}
            </p>
          </div>
          <IsChoiceRandomizedToggle question={question} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label
              className="text-sm font-medium"
              data-testid="label-choice-max-score"
            >
              {t("Components.questionsTab.maxScoreLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("Components.questionsTab.maxScoreDescription")}
            </p>
          </div>
          <MaxScoreEditable question={question} />
        </div>
      </div>
      {choices.map((choice) => (
        <ChoiceItem key={choice.id} choice={choice}>
          <Button
            variant={choice.isCorrect ? "default" : "outline"}
            size="icon"
            onClick={() => handleMarkCorrect(choice.id)}
            aria-label={
              choice.isCorrect
                ? t("Components.questionsTab.markedCorrect")
                : t("Components.questionsTab.markCorrect")
            }
          >
            <Check />
          </Button>
          <ChoiceEditor
            initialValue={choice.choiceText || ""}
            onUpdate={(value) => handleChoiceTextUpdate(choice.id, value)}
            placeholder={t("Components.questionsTab.choiceTextPlaceholder")}
            onUpdateError={(error) => {
              console.error("Failed to update choice text:", error);
            }}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDeleteChoice(choice.id)}
            aria-label={t("Components.questionsTab.deleteChoice")}
            disabled={
              choice.isCorrect ||
              choices.filter((c) => !c.id.startsWith("temp-")).length <= 2
            }
            title={
              choice.isCorrect
                ? t("Components.questionsTab.cannotDeleteCorrect")
                : choices.filter((c) => !c.id.startsWith("temp-")).length <= 2
                  ? t("Components.questionsTab.cannotDeleteMinChoices")
                  : undefined
            }
          >
            <Trash />
          </Button>
        </ChoiceItem>
      ))}
      <Button onClick={handleCreateChoice} data-testid="btn-add-choice">
        {t("Components.questionsTab.addChoice")}
      </Button>
    </div>
  );
}
