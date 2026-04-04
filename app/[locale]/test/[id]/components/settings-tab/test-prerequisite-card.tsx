"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableNumberInput } from "@/components/custom/editable-number-input";
import { useSync } from "../../context/sync-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const AvailableTestSchema = z.object({
  id: z.string(),
  title: z.string(),
});

const PrerequisiteItemSchema = z.object({
  id: z.string(),
  prerequisiteTestId: z.string(),
  minScoreRequired: z.number(),
  prerequisiteTest: AvailableTestSchema,
});

const GetResponseSchema = z.object({
  prerequisites: z.array(PrerequisiteItemSchema),
  availableTests: z.array(AvailableTestSchema),
});

type PrerequisiteItem = z.infer<typeof PrerequisiteItemSchema>;
type AvailableTest = z.infer<typeof AvailableTestSchema>;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TestPrerequisiteCard({ testId }: { testId: string }) {
  const t = useTranslations();
  const { setSaving, setSaved, setError } = useSync();

  const [prerequisites, setPrerequisites] = useState<PrerequisiteItem[]>([]);
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [minScore, setMinScore] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests/${testId}/prerequisites`);
      if (!res.ok) throw new Error("fetch failed");
      const raw = await res.json();
      const data = GetResponseSchema.parse(raw);
      setPrerequisites(data.prerequisites);
      setAvailableTests(data.availableTests);
    } catch {
      toast.error(t("Components.prerequisite.fetchFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [testId, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Add prerequisite
  // ---------------------------------------------------------------------------

  function openDialog() {
    setSelectedTestId("");
    setMinScore(0);
    setDialogOpen(true);
  }

  async function handleAdd() {
    if (!selectedTestId) {
      toast.error(t("Components.prerequisite.selectTestRequired"));
      return;
    }

    const score = minScore ?? 0;

    setIsSubmitting(true);
    setSaving(true);
    setSaved(false);

    // Optimistic: find the selected test info
    const prereqTest = availableTests.find((at) => at.id === selectedTestId);
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: PrerequisiteItem = {
      id: tempId,
      prerequisiteTestId: selectedTestId,
      minScoreRequired: score,
      prerequisiteTest: prereqTest ?? { id: selectedTestId, title: "..." },
    };

    setPrerequisites((prev) => [...prev, optimistic]);
    setAvailableTests((prev) => prev.filter((at) => at.id !== selectedTestId));
    setDialogOpen(false);

    try {
      const res = await fetch(`/api/tests/${testId}/prerequisites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prerequisiteTestId: selectedTestId,
          minScoreRequired: score,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            t("Components.prerequisite.createFailed"),
        );
      }

      const created = PrerequisiteItemSchema.parse(await res.json());

      // Replace temp record with server response
      setPrerequisites((prev) =>
        prev.map((p) => (p.id === tempId ? created : p)),
      );

      toast.success(t("Components.prerequisite.addSuccess"));
      setSaved(true);
    } catch (err) {
      // Rollback
      setPrerequisites((prev) => prev.filter((p) => p.id !== tempId));
      if (prereqTest) setAvailableTests((prev) => [prereqTest, ...prev]);
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("Components.prerequisite.createFailed");
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Remove prerequisite
  // ---------------------------------------------------------------------------

  async function handleRemove(prereq: PrerequisiteItem) {
    // Snapshot both slices before optimistic apply
    const previousPrerequisites = prerequisites;
    const previousAvailable = availableTests;

    setPrerequisites((prev) => prev.filter((p) => p.id !== prereq.id));
    setAvailableTests((prev) => [prereq.prerequisiteTest, ...prev]);
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(
        `/api/tests/${testId}/prerequisites/${prereq.id}`,
        { method: "DELETE" },
      );

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            t("Components.prerequisite.deleteFailed"),
        );
      }

      toast.success(t("Components.prerequisite.deleteSuccess"));
      setSaved(true);
    } catch (err) {
      // Rollback to snapshots
      setPrerequisites(previousPrerequisites);
      setAvailableTests(previousAvailable);
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("Components.prerequisite.deleteFailed");
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Update min score inline
  // ---------------------------------------------------------------------------

  async function handleScoreUpdate(
    prereq: PrerequisiteItem,
    value: number | null,
  ) {
    const score = value ?? 0;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(
        `/api/tests/${testId}/prerequisites/${prereq.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minScoreRequired: score }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: string }).error ??
          t("Components.prerequisite.updateFailed");
        throw new Error(msg); // causes EditableNumberInput to revert
      }

      // Reconcile state on success so initialValue stays in sync
      setPrerequisites((prev) =>
        prev.map((p) =>
          p.id === prereq.id ? { ...p, minScoreRequired: score } : p,
        ),
      );
      toast.success(t("Components.prerequisite.updateSuccess"));
      setSaved(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("Components.prerequisite.updateFailed");
      setError(errorMsg);
      throw err; // causes EditableNumberInput to revert
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="flex flex-col gap-3" data-testid="section-prerequisites">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {t("Components.prerequisite.loading")}
          </p>
        ) : prerequisites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("Components.prerequisite.noPrerequisites")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {prerequisites.map((prereq) => (
              <li
                key={prereq.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 min-w-0"
                data-testid={`prerequisite-item-${prereq.id}`}
              >
                <span className="text-sm font-medium truncate min-w-0 flex-1">
                  {prereq.prerequisiteTest.title}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <div data-testid={`input-prerequisite-score-${prereq.id}`}>
                    <EditableNumberInput
                      initialValue={prereq.minScoreRequired}
                      min={0}
                      max={100}
                      onUpdate={(value) => handleScoreUpdate(prereq, value)}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(prereq)}
                    aria-label={t("Components.prerequisite.removeAriaLabel", {
                      title: prereq.prerequisiteTest.title,
                    })}
                    data-testid={`btn-remove-prerequisite-${prereq.id}`}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={openDialog}
          disabled={isLoading || availableTests.length === 0}
          data-testid="btn-add-prerequisite"
        >
          <PlusIcon className="size-3.5 mr-1" />
          {t("Components.prerequisite.addButton")}
        </Button>

        {!isLoading &&
          availableTests.length === 0 &&
          prerequisites.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t("Components.prerequisite.noTestsAvailable")}
            </p>
          )}
      </div>

      {/* Add Prerequisite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-testid="dialog-add-prerequisite"
        >
          <DialogHeader>
            <DialogTitle>
              {t("Components.prerequisite.dialogTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label htmlFor="prereq-test-select">
                {t("Components.prerequisite.selectTestLabel")}
              </Label>
              <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                <SelectTrigger
                  id="prereq-test-select"
                  className="w-full overflow-hidden"
                  aria-label={t("Components.prerequisite.selectTestLabel")}
                  data-testid="select-prerequisite-test"
                >
                  <SelectValue
                    placeholder={t(
                      "Components.prerequisite.selectTestPlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableTests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      <span className="block truncate max-w-xs">
                        {test.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("Components.prerequisite.minScoreLabel")}</Label>
              <EditableNumberInput
                initialValue={minScore}
                min={0}
                max={100}
                debounceDelay={0}
                onUpdate={async (v) => {
                  setMinScore(v);
                }}
                data-testid="input-min-score"
              />
              <p className="text-xs text-muted-foreground">
                {t("Components.prerequisite.minScoreHint")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("Components.prerequisite.cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting || !selectedTestId}
              data-testid="btn-confirm-prerequisite"
            >
              {isSubmitting
                ? t("Components.prerequisite.adding")
                : t("Components.prerequisite.addConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
