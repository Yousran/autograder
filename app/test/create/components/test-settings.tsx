"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TestFormValues } from "@/lib/validations/test";
import { getUserCreatedTests } from "@/app/actions/get-user-tests";
import { Plus, Trash2 } from "lucide-react";

export function TestSettings() {
  const { register, watch, setValue, control } =
    useFormContext<TestFormValues>();
  const [availableTests, setAvailableTests] = useState<
    Array<{ id: string; title: string; joinCode: string }>
  >([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prerequisites",
  });

  const isAcceptingResponses = watch("isAcceptingResponses");
  const loggedInUserOnly = watch("loggedInUserOnly");
  const showDetailedScore = watch("showDetailedScore");
  const showCorrectAnswers = watch("showCorrectAnswers");
  const isQuestionsOrdered = watch("isQuestionsOrdered");

  useEffect(() => {
    async function fetchTests() {
      setIsLoadingTests(true);
      const result = await getUserCreatedTests();
      if (result.success && result.tests) {
        setAvailableTests(result.tests);
      }
      setIsLoadingTests(false);
    }
    fetchTests();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col justify-center gap-2">
            <Label htmlFor="testDuration">Test Duration (minutes)</Label>
            <Input
              id="testDuration"
              type="number"
              {...register("testDuration", { valueAsNumber: true })}
              placeholder="30"
            />
          </div>

          <div className="flex flex-col justify-center gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              maxLength={500}
              {...register("description")}
              placeholder="Description of the test"
            />
          </div>

          <div className="flex flex-col justify-center gap-2">
            <Label htmlFor="maxAttempts">Max Attempts</Label>
            <Input
              id="maxAttempts"
              type="number"
              min={1}
              {...register("maxAttempts", { valueAsNumber: true })}
              placeholder="Leave empty for unlimited attempts"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Accept Responses</Label>
            <Switch
              checked={isAcceptingResponses}
              onCheckedChange={(checked) =>
                setValue("isAcceptingResponses", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Only Allow Logged In User</Label>
            <Switch
              checked={loggedInUserOnly}
              onCheckedChange={(checked) =>
                setValue("loggedInUserOnly", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Detailed Score</Label>
            <Switch
              checked={showDetailedScore}
              onCheckedChange={(checked) =>
                setValue("showDetailedScore", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Correct Answers</Label>
            <Switch
              checked={showCorrectAnswers}
              onCheckedChange={(checked) =>
                setValue("showCorrectAnswers", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Is Questions Ordered</Label>
            <Switch
              checked={isQuestionsOrdered}
              onCheckedChange={(checked) =>
                setValue("isQuestionsOrdered", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Prerequisites (Optional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Require students to complete other tests before taking this one
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No prerequisites added. This test can be taken by anyone.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`prereq-test-${index}`}>
                      Required Test
                    </Label>
                    <Select
                      value={watch(`prerequisites.${index}.prerequisiteTestId`)}
                      onValueChange={(value) =>
                        setValue(
                          `prerequisites.${index}.prerequisiteTestId`,
                          value
                        )
                      }
                      disabled={isLoadingTests}
                    >
                      <SelectTrigger id={`prereq-test-${index}`}>
                        <SelectValue placeholder="Select a test..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTests.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {isLoadingTests
                              ? "Loading tests..."
                              : "No tests available"}
                          </div>
                        ) : (
                          availableTests.map((test) => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.title} ({test.joinCode})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32">
                    <Label htmlFor={`prereq-score-${index}`}>Min Score</Label>
                    <Input
                      id={`prereq-score-${index}`}
                      type="number"
                      min={0}
                      max={100}
                      {...register(
                        `prerequisites.${index}.minScoreRequired` as const,
                        { valueAsNumber: true }
                      )}
                      placeholder="0-100"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                prerequisiteTestId: "",
                minScoreRequired: 0,
              })
            }
            disabled={isLoadingTests || availableTests.length === 0}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Prerequisite Test
          </Button>

          {availableTests.length === 0 && !isLoadingTests && (
            <p className="text-xs text-muted-foreground text-center">
              Create some tests first to use them as prerequisites
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
