"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

interface EssayGradingModel {
  id: string;
  name: string;
  model: string;
  isDefault: boolean;
}

export function LLMModelSelection({
  testId,
  initialValue,
}: {
  testId: string;
  initialValue: string | null;
}) {
  const t = useTranslations();
  const [models, setModels] = useState<EssayGradingModel[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | null>(
    initialValue || null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch models on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/essay-grading-model");

        if (!res.ok) {
          console.error("Failed to fetch models");
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setModels(data.models || []);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  async function handleSelectChange(nextValue: string) {
    const finalValue = nextValue === "default" ? null : nextValue;
    setSelectedValue(finalValue);

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayGradingModelId: finalValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? t("Api.tests.updateFailed"),
        );
        setSelectedValue(initialValue || null);
        return;
      }

      toast.success(t("Api.tests.updateSuccess"));
    } catch {
      toast.error(t("Api.tests.updateFailed"));
      setSelectedValue(initialValue || null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Spinner className="size-4" />
        <span className="text-sm text-muted-foreground">
          {t("Common.loading")}
        </span>
      </div>
    );
  }

  return (
    <Select
      value={selectedValue ? selectedValue : "default"}
      onValueChange={handleSelectChange}
    >
      <SelectTrigger data-testid="select-llm-model" className="flex-1">
        <SelectValue
          placeholder={
            t("Components.test.llmModelPlaceholder") || "Select a model"
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">
          <div className="flex items-center gap-2">
            <span>{t("Components.test.defaultModel") || "Default"}</span>
          </div>
        </SelectItem>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-2">
              <span>{model.name}</span>
              {model.isDefault && (
                <span className="text-xs text-muted-foreground">
                  {t("Components.test.recommended") || "Recommended"}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
