"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TestDescriptionEditable } from "./test-description-editable";
import { DurationEditable } from "./duration-editable";
import { MaxAttemptEditable } from "./max-attempt-editable";
import { AcceptingResponsesToggle } from "./accepting-responses-toggle";
import { LoggedInUserOnlyToggle } from "./logged-in-user-only-toggle";
import { ShowDetailedScoreToggle } from "./show-detailed-score-toggle";
import { ShowCorrectAnswersToggle } from "./show-correct-answers-toggle";
import { QuestionsOrderedToggle } from "./questions-ordered-toggle";

interface Props {
  testId: string;
  initialDescription: string | null;
  initialDuration: number | null;
  initialMaxAttempts: number | null;
  initialIsAcceptingResponses: boolean;
  initialIsLoggedInUserOnly: boolean;
  initialIsShowDetailedScore: boolean;
  initialIsShowCorrectAnswers: boolean;
  initialIsQuestionsOrdered: boolean;
}

export function SettingsTab({
  testId,
  initialDescription,
  initialDuration,
  initialMaxAttempts,
  initialIsAcceptingResponses,
  initialIsLoggedInUserOnly,
  initialIsShowDetailedScore,
  initialIsShowCorrectAnswers,
  initialIsQuestionsOrdered,
}: Props) {
  const tComponentTest = useTranslations("Components.test");

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-md font-bold">
            {tComponentTest("descriptionLabel")}
          </Label>
          <TestDescriptionEditable
            testId={testId}
            initialDescription={initialDescription}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-md font-bold">
              {tComponentTest("durationLabel")}
            </Label>
            <DurationEditable testId={testId} initialValue={initialDuration} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-md font-bold">
              {tComponentTest("maxAttemptsLabel")}
            </Label>
            <MaxAttemptEditable
              testId={testId}
              initialValue={initialMaxAttempts}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-md font-bold">
              {tComponentTest("isAcceptingResponsesLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {tComponentTest("isAcceptingResponsesDesc")}
            </p>
          </div>
          <AcceptingResponsesToggle
            testId={testId}
            initialValue={initialIsAcceptingResponses}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-md font-bold">
              {tComponentTest("isLoggedInUserOnlyLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {tComponentTest("isLoggedInUserOnlyDesc")}
            </p>
          </div>
          <LoggedInUserOnlyToggle
            testId={testId}
            initialValue={initialIsLoggedInUserOnly}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-md font-bold">
              {tComponentTest("isShowDetailedScoreLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {tComponentTest("isShowDetailedScoreDesc")}
            </p>
          </div>
          <ShowDetailedScoreToggle
            testId={testId}
            initialValue={initialIsShowDetailedScore}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-md font-bold">
              {tComponentTest("isShowCorrectAnswersLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {tComponentTest("isShowCorrectAnswersDesc")}
            </p>
          </div>
          <ShowCorrectAnswersToggle
            testId={testId}
            initialValue={initialIsShowCorrectAnswers}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-md font-bold">
              {tComponentTest("isQuestionsOrderedLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {tComponentTest("isQuestionsOrderedDesc")}
            </p>
          </div>
          <QuestionsOrderedToggle
            testId={testId}
            initialValue={initialIsQuestionsOrdered}
          />
        </div>
      </Card>
      <Card className="p-6 flex flex-col gap-4">
        <Label className="text-md font-bold">Test Prerequisite</Label>
      </Card>
    </div>
  );
}
