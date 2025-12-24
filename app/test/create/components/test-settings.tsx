"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TestFormValues } from "@/lib/validations/test";

export function TestSettings() {
  const { register, watch, setValue } = useFormContext<TestFormValues>();

  const allowMultipleAttempts = watch("allowMultipleAttempts");
  const isAcceptingResponses = watch("isAcceptingResponses");
  const loggedInUserOnly = watch("loggedInUserOnly");
  const showDetailedScore = watch("showDetailedScore");
  const showCorrectAnswers = watch("showCorrectAnswers");
  const isQuestionsOrdered = watch("isQuestionsOrdered");

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
            <Label>Allow Multiple Attempts</Label>
            <Switch
              checked={allowMultipleAttempts}
              onCheckedChange={(checked) =>
                setValue("allowMultipleAttempts", checked)
              }
            />
          </div>

          {allowMultipleAttempts && (
            <div className="flex flex-col justify-center gap-2">
              <Label htmlFor="maxAttempts">Max Attempts (optional)</Label>
              <Input
                id="maxAttempts"
                type="number"
                {...register("maxAttempts", { valueAsNumber: true })}
                placeholder="Leave empty for unlimited"
              />
            </div>
          )}

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
    </div>
  );
}
