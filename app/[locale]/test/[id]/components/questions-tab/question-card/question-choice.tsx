"use client";

import { useEffect, useState } from "react";
import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemHeader,
  ChoiceboxItemTitle,
} from "@/components/ui/choicebox";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ChoiceSchema,
  defaultChoiceData,
  type ChoiceSchema as ChoiceSchemaType,
} from "@/lib/schemas/choice";
import { Button } from "@/components/ui/button";
import { EditableTextarea } from "@/components/custom/editable-textarea";

interface QuestionChoiceProps {
  questionId: string;
}

export function QuestionChoice({ questionId }: QuestionChoiceProps) {
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
      } finally {
        setIsLoading(false);
      }
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
    if (choiceId.startsWith("temp-")) return;

    const previous = choices;

    // Optimistically mark selected as correct and others as false
    setChoices((prev) =>
      prev.map((c) => ({ ...c, isCorrect: c.id === choiceId })),
    );

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
    return (
      <Choicebox className="mt-4">
        <ChoiceboxItem value="loading">
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle>{t("loadingChoices")}</ChoiceboxItemTitle>
          </ChoiceboxItemHeader>
        </ChoiceboxItem>
      </Choicebox>
    );
  }

  if (error) {
    return (
      <Choicebox disabled className="mt-4">
        <ChoiceboxItem value="error" disabled>
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle className="text-red-600">
              {error}
            </ChoiceboxItemTitle>
          </ChoiceboxItemHeader>
        </ChoiceboxItem>
      </Choicebox>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Choicebox className="mt-2">
        {choices.map((choice) => (
          <ChoiceboxItem key={choice.id} value={choice.id}>
            <ChoiceboxItemHeader className="flex items-center justify-between">
              <div className="flex flex-1 items-start gap-3">
                <Button
                  variant={choice.isCorrect ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleMarkCorrect(choice.id)}
                  aria-label={
                    choice.isCorrect ? t("markedCorrect") : t("markCorrect")
                  }
                >
                  <Check className="w-4 h-4" />
                </Button>
                <EditableTextarea
                  initialValue={choice.choiceText || ""}
                  onUpdate={(value) => handleChoiceTextUpdate(choice.id, value)}
                  placeholder={t("choiceTextPlaceholder")}
                  onUpdateError={(error) => {
                    console.error("Failed to update choice text:", error);
                  }}
                />
              </div>
            </ChoiceboxItemHeader>
          </ChoiceboxItem>
        ))}
      </Choicebox>
      <Button onClick={handleCreateChoice} className="mt-4">
        {t("addChoice")}
      </Button>
    </div>
  );
}
