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
import {
  MultipleSelectChoiceSchema,
  type MultipleSelectChoiceSchema as MultipleSelectChoiceType,
} from "@/lib/schemas/multiple-choice";
import { Button } from "@/components/ui/button";
import { EditableTextarea } from "@/components/custom/editable-textarea";

interface QuestionMultipleChoiceProps {
  questionId: string;
}

export function QuestionMultipleChoice({
  questionId,
}: QuestionMultipleChoiceProps) {
  const t = useTranslations("Components.questionsTab");
  const tValidation = useTranslations("Validation");
  const [choices, setChoices] = useState<
    Array<ChoiceSchemaType | MultipleSelectChoiceType>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [questionId, t]);

  const handleCreateChoice = async () => {
    try {
      // Optimistic choice defaults to not-correct (multiple correct allowed)
      const optimisticChoice = {
        ...defaultChoiceData,
        questionId,
        isCorrect: false,
      };
      setChoices((prev) => [...prev, optimisticChoice]);

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

      const resJson = await response.json();
      const created = resJson.choice ?? resJson.multipleSelectChoice ?? resJson;

      let validatedChoice: ChoiceSchemaType | MultipleSelectChoiceType;
      const c1 = ChoiceSchema.safeParse(created);
      if (c1.success) validatedChoice = c1.data;
      else validatedChoice = MultipleSelectChoiceSchema.parse(created);

      setChoices((prev) =>
        prev.map((c) => (c.id === optimisticChoice.id ? validatedChoice : c)),
      );
    } catch (err) {
      console.error("Error creating choice:", err);
      setChoices((prev) => prev.filter((c) => !c.id.startsWith("temp-")));
      setError(err instanceof Error ? err.message : "Failed to create choice");
    }
  };

  const handleToggleCorrect = async (choiceId: string) => {
    const previous = choices;

    const target = previous.find((c) => c.id === choiceId);
    const persistedCorrectCount = previous.filter(
      (c) => !c.id.startsWith("temp-") && c.isCorrect,
    ).length;

    // Prevent unmarking if this is the only persisted correct choice
    if (target?.isCorrect && persistedCorrectCount <= 1) {
      setError(
        t("cannotUnmarkOnlyCorrect") ||
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

    // If the choice is a temp one, don't call the server (it isn't persisted yet)
    if (choiceId.startsWith("temp-")) return;

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
        throw new Error(data.error || "Failed to update choice");
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
    } catch (err) {
      console.error("Error updating choice:", err);
      setChoices(previous);
      setError(err instanceof Error ? err.message : "Failed to update choice");
    }
  };

  const handleDeleteChoice = async (choiceId: string) => {
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
        t("cannotDeleteMinChoices") || "At least two choices are required",
      );
      return;
    }

    const previous = choices;

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
    if (!value || value.trim().length === 0) {
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
      {choices.map((choice) => (
        <ChoiceItem key={choice.id} value={choice.id}>
          <div className="flex flex-1 items-start gap-3">
            <Button
              variant={choice.isCorrect ? "default" : "outline"}
              size="icon"
              onClick={() => handleToggleCorrect(choice.id)}
              aria-label={
                choice.isCorrect ? t("unmarkCorrect") : t("markCorrect")
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
                  ? t("cannotUnmarkOnlyCorrect")
                  : undefined
              }
            >
              <Check />
            </Button>
            <EditableTextarea
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
          </div>
        </ChoiceItem>
      ))}
      <Button onClick={handleCreateChoice}>{t("addChoice")}</Button>
    </div>
  );
}
