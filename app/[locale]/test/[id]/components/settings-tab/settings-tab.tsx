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
import { TestPrerequisiteCard } from "./test-prerequisite-card";

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
}: {
  testId: string;
  initialDescription: string | null;
  initialDuration: number | null;
  initialMaxAttempts: number | null;
  initialIsAcceptingResponses: boolean;
  initialIsLoggedInUserOnly: boolean;
  initialIsShowDetailedScore: boolean;
  initialIsShowCorrectAnswers: boolean;
  initialIsQuestionsOrdered: boolean;
}) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-md font-bold" data-testid="label-description">
            {t("Components.test.descriptionLabel")}
          </Label>
          <TestDescriptionEditable
            testId={testId}
            initialDescription={initialDescription}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-md font-bold" data-testid="label-duration">
              {t("Components.test.durationLabel")}
            </Label>
            <DurationEditable testId={testId} initialValue={initialDuration} />
          </div>
          <div className="flex flex-col gap-1">
            <Label
              className="text-md font-bold"
              data-testid="label-max-attempts"
            >
              {t("Components.test.maxAttemptsLabel")}
            </Label>
            <MaxAttemptEditable
              testId={testId}
              initialValue={initialMaxAttempts}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <Label
              className="text-md font-bold"
              data-testid="label-accepting-responses"
            >
              {t("Components.test.isAcceptingResponsesLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("Components.test.isAcceptingResponsesDesc")}
            </p>
          </div>
          <AcceptingResponsesToggle
            testId={testId}
            initialValue={initialIsAcceptingResponses}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <Label
              className="text-md font-bold"
              data-testid="label-logged-in-only"
            >
              {t("Components.test.isLoggedInUserOnlyLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("Components.test.isLoggedInUserOnlyDesc")}
            </p>
          </div>
          <LoggedInUserOnlyToggle
            testId={testId}
            initialValue={initialIsLoggedInUserOnly}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <Label
              className="text-md font-bold"
              data-testid="label-detailed-score"
            >
              {t("Components.test.isShowDetailedScoreLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("Components.test.isShowDetailedScoreDesc")}
            </p>
          </div>
          <ShowDetailedScoreToggle
            testId={testId}
            initialValue={initialIsShowDetailedScore}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <Label
              className="text-md font-bold"
              data-testid="label-correct-answers"
            >
              {t("Components.test.isShowCorrectAnswersLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("Components.test.isShowCorrectAnswersDesc")}
            </p>
          </div>
          <ShowCorrectAnswersToggle
            testId={testId}
            initialValue={initialIsShowCorrectAnswers}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 min-w-0">
            <Label
              className="text-md font-bold"
              data-testid="label-questions-ordered"
            >
              {t("Components.test.isQuestionsOrderedLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("Components.test.isQuestionsOrderedDesc")}
            </p>
          </div>
          <QuestionsOrderedToggle
            testId={testId}
            initialValue={initialIsQuestionsOrdered}
          />
        </div>
      </Card>
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-md font-bold">
            {t("Components.test.prerequisiteLabel")}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t("Components.test.prerequisiteDesc")}
          </p>
        </div>
        <TestPrerequisiteCard testId={testId} />
      </Card>
    </div>
  );
}
