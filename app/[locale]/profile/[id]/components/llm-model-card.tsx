"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  createEssayGradingModelSchema,
  essayGradingModelResponseSchema,
} from "@/lib/schemas/essay-grading-model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const GetResponseSchema = z.object({
  models: z.array(essayGradingModelResponseSchema),
});

type LLMModel = z.infer<typeof essayGradingModelResponseSchema>;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LLMModelCard() {
  const t = useTranslations();

  const [models, setModels] = useState<LLMModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LLMModel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "",
    model: "",
    apiKey: "",
    isDefault: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/essay-grading-model");
      if (!res.ok) throw new Error("fetch failed");
      const raw = await res.json();
      const data = GetResponseSchema.parse(raw);
      setModels(data.models);
    } catch {
      toast.error(t("Components.llmModel.fetchFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchModels();
  }, [fetchModels]);

  // ---------------------------------------------------------------------------
  // Dialog handlers
  // ---------------------------------------------------------------------------

  function openDialog() {
    setEditingModel(null);
    setFormData({
      name: "",
      baseUrl: "",
      model: "",
      apiKey: "",
      isDefault: false,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEditDialog(model: LLMModel) {
    setEditingModel(model);
    setFormData({
      name: model.name,
      baseUrl: model.baseUrl,
      model: model.model,
      apiKey: "", // API key is never shown/pre-filled for security
      isDefault: model.isDefault,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function handleInputChange(
    field: keyof typeof formData,
    value: string | boolean,
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleAdd() {
    if (editingModel) {
      // Update existing model - validate only required fields
      const errors: Record<string, string> = {};

      if (!formData.name.trim()) {
        errors.name = t("Validation.fieldRequired", {
          field: t("Components.llmModel.nameLabel"),
        });
      }
      if (!formData.baseUrl.trim()) {
        errors.baseUrl = t("Validation.fieldRequired", {
          field: t("Components.llmModel.baseUrlLabel"),
        });
      }
      if (!formData.model.trim()) {
        errors.model = t("Validation.fieldRequired", {
          field: t("Components.llmModel.modelLabel"),
        });
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      await handleUpdate(editingModel.id);
    } else {
      // Create new model - use full validation schema
      const schema = createEssayGradingModelSchema((key) => t(key));
      const parsed = schema.safeParse(formData);

      if (!parsed.success) {
        const errors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          errors[path] = issue.message;
        });
        setFormErrors(errors);
        return;
      }

      await handleCreate(parsed.data);
    }
  }

  async function handleCreate(
    data: z.infer<ReturnType<typeof createEssayGradingModelSchema>>,
  ) {
    setIsSubmitting(true);

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: LLMModel = {
      id: tempId,
      userId: "", // Will be set by server
      name: formData.name,
      baseUrl: formData.baseUrl,
      model: formData.model,
      apiKey: formData.apiKey || null,
      isDefault: formData.isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setModels((prev) => [optimistic, ...prev]);
    setDialogOpen(false);

    try {
      const res = await fetch("/api/essay-grading-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            t("Components.llmModel.createFailed"),
        );
      }

      const created = essayGradingModelResponseSchema.parse(await res.json());

      // Replace temp record with server response
      setModels((prev) => prev.map((m) => (m.id === tempId ? created : m)));

      toast.success(t("Components.llmModel.addSuccess"));
    } catch (err) {
      // Rollback
      setModels((prev) => prev.filter((m) => m.id !== tempId));
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : t("Components.llmModel.createFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(modelId: string) {
    setIsSubmitting(true);
    const previousModels = models;

    // Optimistically update the model
    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId
          ? {
              ...m,
              name: formData.name,
              baseUrl: formData.baseUrl,
              model: formData.model,
              isDefault: formData.isDefault,
            }
          : m,
      ),
    );
    setDialogOpen(false);

    try {
      const updateData = {
        name: formData.name,
        baseUrl: formData.baseUrl,
        model: formData.model,
        isDefault: formData.isDefault,
        ...(formData.apiKey ? { apiKey: formData.apiKey } : {}),
      };

      const res = await fetch(`/api/essay-grading-model/${modelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            t("Components.llmModel.updateFailed"),
        );
      }

      const updated = essayGradingModelResponseSchema.parse(await res.json());

      // Replace with server response
      setModels((prev) => prev.map((m) => (m.id === modelId ? updated : m)));

      toast.success(t("Components.llmModel.updateSuccess"));
    } catch (err) {
      // Rollback
      setModels(previousModels);
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : t("Components.llmModel.updateFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Remove model
  // ---------------------------------------------------------------------------

  async function handleRemove(model: LLMModel) {
    const previousModels = models;

    setModels((prev) => prev.filter((m) => m.id !== model.id));

    try {
      const res = await fetch(`/api/essay-grading-model/${model.id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            t("Components.llmModel.deleteFailed"),
        );
      }

      toast.success(t("Components.llmModel.deleteSuccess"));
    } catch (err) {
      // Rollback
      setModels(previousModels);
      toast.error(
        err instanceof Error
          ? err.message
          : t("Components.llmModel.deleteFailed"),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="flex flex-col gap-3" data-testid="section-llm-models">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {t("Components.llmModel.loading")}
          </p>
        ) : models.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("Components.llmModel.noModels")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {models.map((model) => (
              <li
                key={model.id}
                className="flex items-center justify-between p-4 gap-4 rounded-md border cursor-pointer hover:bg-accent transition-colors"
                onClick={() => openEditDialog(model)}
                data-testid={`llm-model-item-${model.id}`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate">
                    {model.name}
                  </span>
                  <span className="text-xs text-muted-foreground block truncate">
                    {model.baseUrl}
                  </span>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {model.model}
                    </Badge>
                    {model.isDefault && (
                      <Badge variant="default" className="text-xs">
                        {t("Components.llmModel.default")}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(model);
                  }}
                  aria-label={t("Components.llmModel.removeAriaLabel", {
                    name: model.name,
                  })}
                  data-testid={`btn-remove-llm-model-${model.id}`}
                >
                  <Trash />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button
          variant="outline"
          className="self-start"
          onClick={openDialog}
          disabled={isLoading}
          data-testid="btn-add-llm-model"
        >
          <Plus className="size-3.5 mr-1" />
          {t("Components.llmModel.addButton")}
        </Button>
      </div>

      {/* Add LLM Model Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-testid="dialog-add-llm-model"
        >
          <DialogHeader>
            <DialogTitle>
              {editingModel
                ? t("Components.llmModel.editDialogTitle")
                : t("Components.llmModel.dialogTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Model Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="model-name">
                {t("Components.llmModel.nameLabel")}
              </Label>
              <Input
                id="model-name"
                placeholder={t("Components.llmModel.namePlaceholder")}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                data-testid="input-model-name"
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Base URL */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="base-url">
                {t("Components.llmModel.baseUrlLabel")}
              </Label>
              <Input
                id="base-url"
                type="url"
                placeholder={t("Components.llmModel.baseUrlPlaceholder")}
                value={formData.baseUrl}
                onChange={(e) => handleInputChange("baseUrl", e.target.value)}
                data-testid="input-base-url"
              />
              {formErrors.baseUrl && (
                <p className="text-xs text-destructive">{formErrors.baseUrl}</p>
              )}
            </div>

            {/* Model Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="model">
                {t("Components.llmModel.modelLabel")}
              </Label>
              <Input
                id="model"
                placeholder={t("Components.llmModel.modelPlaceholder")}
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                data-testid="input-model"
              />
              {formErrors.model && (
                <p className="text-xs text-destructive">{formErrors.model}</p>
              )}
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="api-key">
                {t("Components.llmModel.apiKeyLabel")}
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder={t("Components.llmModel.apiKeyPlaceholder")}
                value={formData.apiKey}
                onChange={(e) => handleInputChange("apiKey", e.target.value)}
                data-testid="input-api-key"
              />
              <p className="text-xs text-muted-foreground">
                {editingModel
                  ? t("Components.llmModel.apiKeyEditDescription")
                  : t("Components.llmModel.apiKeyDescription")}
              </p>
            </div>

            {/* Is Default */}
            <div className="flex items-center justify-between gap-4 p-2 rounded-md border">
              <Label htmlFor="is-default" className="cursor-pointer">
                {t("Components.llmModel.isDefaultLabel")}
              </Label>
              <Switch
                id="is-default"
                checked={formData.isDefault}
                onCheckedChange={(value) =>
                  handleInputChange("isDefault", value)
                }
                data-testid="switch-is-default"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("Components.llmModel.cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting}
              data-testid="btn-confirm-llm-model"
            >
              {isSubmitting
                ? editingModel
                  ? t("Components.llmModel.updating")
                  : t("Components.llmModel.adding")
                : editingModel
                  ? t("Components.llmModel.updateConfirm")
                  : t("Components.llmModel.addConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
