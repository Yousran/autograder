"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlateReadOnlyViewer } from "@/components/custom/plate-readonly-viewer";
import { ChoiceItem } from "@/components/custom/choice-item";
import { useTranslations } from "next-intl";
import {
  getQuestionTypeLabel,
  QuestionWithAnswer,
} from "@/lib/schemas/question";
import type {
  Choice,
  MultipleSelectChoice,
} from "@/lib/generated/prisma/client";

/**
 * Shared read-only card for displaying a question with its participant answer.
 * Pass a `scoreControl` ReactNode (client component) to make the score editable (creator view).
 */
export function QuestionDetailCard({
  questionNumber,
  question,
  showDetailedScore,
  showCorrectAnswers,
  scoreControl,
}: {
  question: QuestionWithAnswer;
  questionNumber: number;
  showDetailedScore: boolean;
  showCorrectAnswers?: boolean;
  scoreControl?: React.ReactNode;
}) {
  const t = useTranslations("Pages.participantDetails");
  const tQuestionTypes = useTranslations("Components.questionsTab");
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <span className="text-md font-bold">{questionNumber}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="text-sm font-medium tabular-nums"
            >
              {getQuestionTypeLabel(question.type, tQuestionTypes)}
            </Badge>
            {showDetailedScore &&
              (() => {
                const score =
                  question.essay?.answers?.[0]?.score ??
                  question.choice?.answers?.[0]?.score ??
                  question.multipleSelect?.answers?.[0]?.score ??
                  0;
                const maxScore =
                  question.essay?.maxScore ??
                  question.choice?.maxScore ??
                  question.multipleSelect?.maxScore ??
                  0;

                return (
                  <Badge
                    variant={score === maxScore ? "default" : "outline"}
                    className="text-sm font-medium tabular-nums"
                  >
                    {score}/{maxScore}
                  </Badge>
                );
              })()}
          </div>
        </div>
        {/* Question text */}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="min-w-0 w-full overflow-hidden">
          <PlateReadOnlyViewer value={question.questionText} />
        </div>
        {/* ---- ESSAY ---- */}
        {question.type === "ESSAY" && question.essay && (
          <>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("yourAnswer")}
              </p>
              {question.essay.answers?.[0]?.answerText?.trim() ? (
                <div className="min-w-0 overflow-hidden rounded-md border px-3 py-2 text-sm">
                  <PlateReadOnlyViewer
                    value={question.essay.answers[0].answerText}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("notAnswered")}
                </p>
              )}
            </div>

            {showCorrectAnswers && question.essay.answerText && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("correctAnswer")}
                </p>
                <div className="min-w-0 overflow-hidden rounded-md outline-1 outline-green-500/50 px-3 py-2 text-sm">
                  <PlateReadOnlyViewer value={question.essay.answerText} />
                </div>
              </div>
            )}

            {showDetailedScore &&
              question.essay.answers?.[0]?.scoreExplanation &&
              !scoreControl && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("scoreExplanation")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {question.essay.answers[0].scoreExplanation}
                  </p>
                </div>
              )}
          </>
        )}

        {/* ---- CHOICE ---- */}
        {question.type === "CHOICE" && question.choice && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("yourAnswer")}
              </p>
              {question.choice.answers?.[0]?.choice ? (
                <ChoiceItem
                  choice={
                    question.choice.answers[0]
                      .choice as unknown as Choice | null
                  }
                >
                  <PlateReadOnlyViewer
                    value={question.choice.answers[0].choice?.choiceText ?? ""}
                  />
                </ChoiceItem>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("notAnswered")}
                </p>
              )}
            </div>

            {showCorrectAnswers && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("correctAnswer", { count: 1 })}
                </p>
                <div className="flex flex-col gap-2">
                  {question.choice.choices
                    .filter((c) => c.isCorrect)
                    .map((choice) => (
                      <ChoiceItem
                        key={choice.id}
                        choice={choice as unknown as Choice}
                      >
                        <PlateReadOnlyViewer value={choice.choiceText} />
                      </ChoiceItem>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- MULTIPLE SELECT ---- */}
        {question.type === "MULTIPLE_SELECT" && question.multipleSelect && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("yourAnswer")}
              </p>
              {question.multipleSelect.answers?.[0]?.selectedChoices &&
              question.multipleSelect.answers[0].selectedChoices.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {question.multipleSelect.answers[0].selectedChoices.map(
                    (choice) => (
                      <ChoiceItem
                        key={choice.id}
                        choice={choice as unknown as MultipleSelectChoice}
                      >
                        <PlateReadOnlyViewer value={choice.choiceText} />
                      </ChoiceItem>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("notAnswered")}
                </p>
              )}
            </div>

            {showCorrectAnswers && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("correctAnswer", { count: 2 })}
                </p>
                <div className="flex flex-col gap-2">
                  {question.multipleSelect.multipleSelectChoices
                    .filter((c) => c.isCorrect)
                    .map((choice) => (
                      <ChoiceItem
                        key={choice.id}
                        choice={choice as unknown as MultipleSelectChoice}
                      >
                        <PlateReadOnlyViewer value={choice.choiceText} />
                      </ChoiceItem>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {scoreControl && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                SCORE
              </p>
              {scoreControl}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
