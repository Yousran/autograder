// file: app/test/create/components/test-settings.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TestFormValues } from "../page";
import { Textarea } from "@/components/ui/textarea";

export function TestSettings({
  test,
  setTest,
  onUpdateField,
}: {
  test: TestFormValues;
  setTest: (test: TestFormValues) => void;
  onUpdateField?: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col justify-center gap-2">
            <Label htmlFor="testDuration">Test Duration (minutes)</Label>
            <Input
              id="testDuration"
              type="number"
              value={test.testDuration}
              onChange={(e) =>
                setTest({
                  ...test,
                  testDuration: Number(e.target.value),
                })
              }
            />
          </div>

          {/* TODO: Edit Description */}
          <div className="flex flex-col justify-center gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={test.description}
              onChange={(e) => {
                setTest({ ...test, description: e.target.value });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Accept Responses</Label>
            <Switch
              checked={test.acceptResponses}
              onCheckedChange={(v) => {
                setTest({ ...test, acceptResponses: v });
                onUpdateField?.("acceptResponses", v);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Detailed Score</Label>
            <Switch
              checked={test.showDetailedScore}
              onCheckedChange={(v) => {
                setTest({ ...test, showDetailedScore: v });
                onUpdateField?.("showDetailedScore", v);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Correct Answers</Label>
            <Switch
              checked={test.showCorrectAnswers}
              onCheckedChange={(v) => {
                setTest({ ...test, showCorrectAnswers: v });
                onUpdateField?.("showCorrectAnswers", v);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Is Ordered</Label>
            <Switch
              checked={test.isOrdered}
              onCheckedChange={(v) => {
                setTest({ ...test, isOrdered: v });
                onUpdateField?.("isOrdered", v);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
