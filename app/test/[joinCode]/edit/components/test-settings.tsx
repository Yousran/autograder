"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebouncedCallback } from "use-debounce";
import { useCallback, useRef, useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { TestValidation, testSchema } from "@/lib/validations/test";
import {
  testPrerequisiteSchema,
  TestPrerequisiteValidation,
} from "@/lib/validations/test-prerequisite";
import { Test } from "@/lib/generated/prisma/client";
import { editTest } from "@/app/actions/test/edit";
import {
  getTestPrerequisites,
  getAvailablePrerequisiteTests,
  addTestPrerequisite,
  updateTestPrerequisite,
  deleteTestPrerequisite,
} from "@/app/actions/prerequisite";
import {
  TestPrerequisiteWithTest,
  AvailablePrerequisiteTest,
} from "@/types/test-prerequisite";
import { toast } from "sonner";
import { useSyncTracker } from "../context/optimistic-context";
import { Plus, Trash2, Loader2 } from "lucide-react";

// --- PREREQUISITE SECTION COMPONENT ---
function PrerequisiteSection({ testId }: { testId: string }) {
  const { trackSync } = useSyncTracker();
  const [prerequisites, setPrerequisites] = useState<
    TestPrerequisiteWithTest[]
  >([]);
  const [availableTests, setAvailableTests] = useState<
    AvailablePrerequisiteTest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form for adding new prerequisite
  const addForm = useForm({
    resolver: zodResolver(testPrerequisiteSchema),
    defaultValues: {
      prerequisiteTestId: "",
      minScoreRequired: 0,
    },
  });

  // Load prerequisites and available tests on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prereqResult, testsResult] = await Promise.all([
          getTestPrerequisites(testId),
          getAvailablePrerequisiteTests(testId),
        ]);

        if (prereqResult.success && prereqResult.prerequisites) {
          setPrerequisites(prereqResult.prerequisites);
        }

        if (testsResult.success && testsResult.tests) {
          setAvailableTests(testsResult.tests);
        }
      } catch (error) {
        console.error("Error loading prerequisites:", error);
        toast.error("Failed to load prerequisites");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [testId]);

  // Handle adding a new prerequisite
  const handleAddPrerequisite = async (data: TestPrerequisiteValidation) => {
    setIsAdding(true);
    try {
      const result = await addTestPrerequisite(testId, data);
      if (result.success && result.prerequisite) {
        setPrerequisites((prev) => [...prev, result.prerequisite!]);
        // Remove from available tests
        setAvailableTests((prev) =>
          prev.filter((t) => t.id !== data.prerequisiteTestId)
        );
        setIsAddDialogOpen(false);
        addForm.reset();
        toast.success("Prerequisite added successfully");
      } else {
        toast.error(result.error || "Failed to add prerequisite");
      }
    } catch (error) {
      console.error("Error adding prerequisite:", error);
      toast.error("Failed to add prerequisite");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle updating minimum score
  const handleUpdateScore = async (
    prerequisiteId: string,
    minScoreRequired: number
  ) => {
    await trackSync(
      `prereq-${prerequisiteId}`,
      async () => {
        const result = await updateTestPrerequisite(
          prerequisiteId,
          minScoreRequired
        );
        if (result.success && result.prerequisite) {
          setPrerequisites((prev) =>
            prev.map((p) =>
              p.id === prerequisiteId ? result.prerequisite! : p
            )
          );
        } else {
          toast.error(result.error || "Failed to update prerequisite");
        }
        return result;
      },
      "Updating minimum score..."
    );
  };

  // Debounced score update
  const debouncedScoreUpdate = useDebouncedCallback(
    (prerequisiteId: string, score: number) => {
      handleUpdateScore(prerequisiteId, score);
    },
    1000
  );

  // Handle deleting a prerequisite
  const handleDeletePrerequisite = async (
    prerequisiteId: string,
    prerequisiteTest: AvailablePrerequisiteTest
  ) => {
    const result = await deleteTestPrerequisite(prerequisiteId);
    if (result.success) {
      setPrerequisites((prev) => prev.filter((p) => p.id !== prerequisiteId));
      // Add back to available tests
      setAvailableTests((prev) => [...prev, prerequisiteTest]);
      toast.success("Prerequisite removed successfully");
    } else {
      toast.error(result.error || "Failed to remove prerequisite");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Prerequisites</CardTitle>
          <CardDescription>
            Require participants to complete other tests first
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Test Prerequisites</CardTitle>
            <CardDescription>
              Require participants to complete other tests first
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={availableTests.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Prerequisite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Prerequisite Test</DialogTitle>
                <DialogDescription>
                  Select a test that participants must complete before taking
                  this test.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={addForm.handleSubmit(handleAddPrerequisite)}>
                <div className="flex flex-col gap-4 py-4">
                  <FormItem>
                    <FormLabel>Select Test</FormLabel>
                    <Select
                      value={addForm.watch("prerequisiteTestId")}
                      onValueChange={(value) =>
                        addForm.setValue("prerequisiteTestId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a test" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTests.map((test) => (
                          <SelectItem key={test.id} value={test.id}>
                            {test.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {addForm.formState.errors.prerequisiteTestId && (
                      <p className="text-sm text-destructive">
                        {addForm.formState.errors.prerequisiteTestId.message}
                      </p>
                    )}
                  </FormItem>

                  <FormItem>
                    <FormLabel>Minimum Score Required (%)</FormLabel>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...addForm.register("minScoreRequired", {
                        valueAsNumber: true,
                      })}
                      placeholder="0"
                    />
                    {addForm.formState.errors.minScoreRequired && (
                      <p className="text-sm text-destructive">
                        {addForm.formState.errors.minScoreRequired.message}
                      </p>
                    )}
                  </FormItem>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Prerequisite
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {prerequisites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No prerequisites configured.</p>
            <p className="text-sm mt-1">
              Add a prerequisite to require participants to complete other tests
              first.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {prerequisites.map((prereq) => (
              <PrerequisiteItem
                key={prereq.id}
                prerequisite={prereq}
                onScoreChange={(score) =>
                  debouncedScoreUpdate(prereq.id, score)
                }
                onDelete={() =>
                  handleDeletePrerequisite(prereq.id, prereq.prerequisiteTest)
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- PREREQUISITE ITEM COMPONENT ---
function PrerequisiteItem({
  prerequisite,
  onScoreChange,
  onDelete,
}: {
  prerequisite: TestPrerequisiteWithTest;
  onScoreChange: (score: number) => void;
  onDelete: () => void;
}) {
  const [localScore, setLocalScore] = useState(prerequisite.minScoreRequired);

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
      <div className="flex-1">
        <p className="font-medium">{prerequisite.prerequisiteTest.title}</p>
        <p className="text-sm text-muted-foreground">
          Code: {prerequisite.prerequisiteTest.joinCode}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            Min Score:
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            className="w-20"
            value={localScore}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalScore(val);
              onScoreChange(val);
            }}
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Prerequisite</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove &quot;
                {prerequisite.prerequisiteTest.title}&quot; as a prerequisite?
                Participants will no longer need to complete this test first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function TestSettings({ test }: { test: Test }) {
  const { trackSync } = useSyncTracker();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSavedRef = useRef<Record<string, any>>({});

  // 1. Initialize Form with Default Values from the DB 'test' object
  const form = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      description: test.description || undefined,
      testDuration: test.testDuration,
      maxAttempts: test.maxAttempts,
      isAcceptingResponses: test.isAcceptingResponses,
      loggedInUserOnly: test.loggedInUserOnly,
      showDetailedScore: test.showDetailedScore,
      showCorrectAnswers: test.showCorrectAnswers,
      isQuestionsOrdered: test.isQuestionsOrdered,
    },
    mode: "onChange",
  });

  // 2. The Central Save Handler with global sync tracking
  const handleSave = useCallback(
    async (field: keyof TestValidation, value: unknown) => {
      const data = { [field]: value } as Partial<TestValidation>;

      // Skip if value hasn't changed
      if (lastSavedRef.current[field] === value) {
        return;
      }

      // Track with global sync
      await trackSync(
        `setting-${field}`,
        async () => {
          const result = await editTest(test.id, data);
          if (result.success) {
            // Update last saved value
            lastSavedRef.current[field] = value;
          } else {
            toast.error(`Failed to save: ${result.error}`);
          }
          return result;
        },
        `Saving ${field}...`
      );
    },
    [test.id, trackSync]
  );

  // 3. Debouncer for Text/Number Inputs (1s delay for debounce, immediate UI update)
  const debouncedSave = useDebouncedCallback(
    (field: keyof TestValidation, value: unknown) => {
      handleSave(field, value);
    },
    1000
  );

  // Immediate save for switches (but still async)
  const immediateSave = useCallback(
    (field: keyof TestValidation, value: unknown) => {
      handleSave(field, value);
    },
    [handleSave]
  );

  return (
    <Form {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Test Settings</CardTitle>
          <CardDescription>All changes are saved automatically</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* --- TEXT AREA: Description --- */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description of the test"
                    className="resize-none"
                    maxLength={500}
                    {...field}
                    onChange={(e) => {
                      // Immediate UI update (optimistic)
                      field.onChange(e);
                      // Debounced server sync
                      debouncedSave("description", e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- NUMBER INPUT: Test Duration --- */}
          <FormField
            control={form.control}
            name="testDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    min={1}
                    {...field}
                    value={(field.value ?? "") as string | number}
                    onChange={(e) => {
                      const val =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);

                      // Immediate UI update (optimistic)
                      field.onChange(val);

                      // Debounced server sync (only if valid)
                      const isValid =
                        !form.getFieldState("testDuration").invalid;
                      if (isValid) debouncedSave("testDuration", val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- NUMBER INPUT: Max Attempts --- */}
          <FormField
            control={form.control}
            name="maxAttempts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Attempts</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    min={1}
                    {...field}
                    value={(field.value ?? "") as string | number}
                    onChange={(e) => {
                      const val =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);

                      // Immediate UI update (optimistic)
                      field.onChange(val);

                      // Debounced server sync (only if valid)
                      const isValid =
                        !form.getFieldState("maxAttempts").invalid;
                      if (isValid) debouncedSave("maxAttempts", val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- SWITCHES (Immediate UI Update, Async Save) --- */}

          <FormField
            control={form.control}
            name="isAcceptingResponses"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">Accept Responses</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("isAcceptingResponses", checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loggedInUserOnly"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">
                  Only Allow Logged In User
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("loggedInUserOnly", checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showDetailedScore"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">Show Detailed Score</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("showDetailedScore", checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showCorrectAnswers"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">
                  Show Correct Answers
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("showCorrectAnswers", checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isQuestionsOrdered"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel className="text-base">
                  Is Questions Ordered
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      // Immediate UI update (optimistic)
                      field.onChange(checked);
                      // Async server sync
                      immediateSave("isQuestionsOrdered", checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* --- PREREQUISITES SECTION --- */}
      <PrerequisiteSection testId={test.id} />
    </Form>
  );
}
