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
import {
  MultipleSelectChoiceSchema,
  type MultipleSelectChoiceSchema as MultipleSelectChoiceType,
} from "@/lib/schemas/multiple-choice";
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

export function QuestionMultipleChoice({
  question,
}: {
  question: QuestionWithDetails;
}) {
  const t = useTranslations();
  const [choices, setChoices] = useState<
    Array<ChoiceSchemaType | MultipleSelectChoiceType>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingChoices, setUpdatingChoices] = useState<Set<string>>(
    new Set(),
  );
  const { setSaving, setSaved, setError } = useSync();

  useEffect(() => {
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
        const validatedChoices = data
          .map((choice: unknown) => {
            const c1 = ChoiceSchema.safeParse(choice);
            if (c1.success) return c1.data;
            const c2 = MultipleSelectChoiceSchema.safeParse(choice);
            return c2.success ? c2.data : null;
          })
          .filter(
            (choice: ChoiceSchemaType | MultipleSelectChoiceType) =>
              choice !== null,
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
      // Optimistic choice defaults to not-correct (multiple correct allowed)
      const optimisticChoice = {
        ...defaultChoiceData,
        questionId: question.id,
        isCorrect: false,
      };
      setChoices((prev) => [...prev, optimisticChoice]);
      setSaving(true);
      setSaved(false);

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

      const resJson = await response.json();
      const created = resJson.choice ?? resJson.multipleSelectChoice ?? resJson;

      let validatedChoice: ChoiceSchemaType | MultipleSelectChoiceType;
      const c1 = ChoiceSchema.safeParse(created);
      if (c1.success) validatedChoice = c1.data;
      else validatedChoice = MultipleSelectChoiceSchema.parse(created);

      setChoices((prev) =>
        prev.map((c) => (c.id === optimisticChoice.id ? validatedChoice : c)),
      );
      setSaved(true);
    } catch (err) {
      console.error("Error creating choice:", err);
      setChoices((prev) => prev.filter((c) => !c.id.startsWith("temp-")));
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create choice";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCorrect = async (choiceId: string) => {
    // Prevent spam on the same choice
    if (updatingChoices.has(choiceId)) return;

    const previous = choices;

    const target = previous.find((c) => c.id === choiceId);
    const persistedCorrectCount = previous.filter(
      (c) => !c.id.startsWith("temp-") && c.isCorrect,
    ).length;

    // Prevent unmarking if this is the only persisted correct choice
    if (target?.isCorrect && persistedCorrectCount <= 1) {
      setError(
        t("Components.questionsTab.cannotUnmarkOnlyCorrect") ||
          "At least one choice must remain correct",
      );
      return;
    }

    // Optimistically toggle the choice's correctness locally
    setChoices((prev) =>
      prev.map((c) =>
        c.id === choiceId ? { ...c, isCorrect: !c.isCorrect } : c,
      ),
    );
    setUpdatingChoices((prev) => new Set([...prev, choiceId]));
    setSaving(true);
    setSaved(false);

    // If the choice is a temp one, don't call the server (it isn't persisted yet)
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
      const target = previous.find((c) => c.id === choiceId);
      const newValue = !target?.isCorrect;

      const response = await fetch(
        `/api/choices/${encodeURIComponent(choiceId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCorrect: newValue }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || "Failed to update choice";
        throw new Error(errorMsg);
      }

      const res = await response.json();
      const created = res.choice ?? res.multipleSelectChoice ?? res;
      let updated: ChoiceSchemaType | MultipleSelectChoiceType;
      const p1 = ChoiceSchema.safeParse(created);
      if (p1.success) updated = p1.data;
      else updated = MultipleSelectChoiceSchema.parse(created);

      // Replace only the updated choice
      setChoices((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
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
    // Prevent spam on the same choice
    if (updatingChoices.has(choiceId)) return;

    if (choiceId.startsWith("temp-")) {
      setChoices((prev) => prev.filter((c) => c.id !== choiceId));
      return;
    }

    const target = choices.find((c) => c.id === choiceId);
    const persistedCount = choices.filter(
      (c) => !c.id.startsWith("temp-"),
    ).length;
    if (!target) return;
    if (persistedCount <= 2) {
      setError(
        t("Components.questionsTab.cannotDeleteMinChoices") ||
          "At least two choices are required",
      );
      return;
    }

    const previous = choices;

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
            onClick={() => handleToggleCorrect(choice.id)}
            aria-label={
              choice.isCorrect
                ? t("Components.questionsTab.unmarkCorrect")
                : t("Components.questionsTab.markCorrect")
            }
            disabled={
              choice.isCorrect &&
              choices.filter((c) => !c.id.startsWith("temp-") && c.isCorrect)
                .length <= 1
            }
            title={
              choice.isCorrect &&
              choices.filter((c) => !c.id.startsWith("temp-") && c.isCorrect)
                .length <= 1
                ? t("Components.questionsTab.cannotUnmarkOnlyCorrect")
                : undefined
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
            className="flex-1"
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
