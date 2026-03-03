import { CheckCircle2, Circle, MinusCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlateReadOnlyViewer } from "@/components/custom/plate-readonly-viewer";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChoiceItemView = {
  id: string;
  text: string;
  isSelected: boolean;
  /** null means correctness is hidden from the viewer */
  isCorrect: boolean | null;
};

export type EssayAnswerView = {
  id: string;
  answerText: string;
  /** null means don't show correct answer */
  correctAnswer: string | null;
  score: number;
  maxScore: number;
  scoreExplanation: string | null;
};

export type ChoiceAnswerView = {
  id: string;
  choices: ChoiceItemView[];
  score: number;
  maxScore: number;
};

export type MultipleSelectAnswerView = {
  id: string;
  choices: ChoiceItemView[];
  score: number;
  maxScore: number;
};

export interface QuestionDetailCardProps {
  questionNumber: number;
  questionText: string;
  type: "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";
  essay?: EssayAnswerView | null;
  choice?: ChoiceAnswerView | null;
  multipleSelect?: MultipleSelectAnswerView | null;
  showDetailedScore: boolean;
  /** ReactNode slot — pass nothing for participant view, pass a score control for creator edit view */
  scoreControl?: React.ReactNode;
  labels: {
    essay: string;
    choice: string;
    multipleSelect: string;
    yourAnswer: string;
    correctAnswer: string;
    notAnswered: string;
    score: string;
    scoreExplanation: string;
    correct: string;
    incorrect: string;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function TypeBadge({
  type,
  labels,
}: {
  type: QuestionDetailCardProps["type"];
  labels: QuestionDetailCardProps["labels"];
}) {
  const label =
    type === "ESSAY"
      ? labels.essay
      : type === "CHOICE"
        ? labels.choice
        : labels.multipleSelect;
  return (
    <Badge variant="secondary" className="text-xs">
      {label}
    </Badge>
  );
}

function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
  const isFullScore = score === maxScore;
  return (
    <Badge
      variant={isFullScore ? "default" : score > 0 ? "secondary" : "outline"}
      className="tabular-nums"
    >
      {score} / {maxScore}
    </Badge>
  );
}

function ChoiceList({
  choices,
  labels,
}: {
  choices: ChoiceItemView[];
  labels: QuestionDetailCardProps["labels"];
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {choices.map((choice) => {
        const showCorrectness = choice.isCorrect !== null;
        const isCorrect = choice.isCorrect === true;
        const isWrong = choice.isCorrect === false && choice.isSelected;

        return (
          <li
            key={choice.id}
            className={cn(
              "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
              choice.isSelected &&
                !showCorrectness &&
                "bg-primary/10 font-medium",
              showCorrectness && isCorrect && "bg-green-500/10",
              showCorrectness && isWrong && "bg-red-500/10",
              showCorrectness &&
                !choice.isSelected &&
                !isCorrect &&
                "opacity-60",
            )}
          >
            <span className="mt-0.5 shrink-0">
              {!showCorrectness && choice.isSelected && (
                <Circle className="size-4 fill-primary text-primary" />
              )}
              {!showCorrectness && !choice.isSelected && (
                <Circle className="size-4 text-muted-foreground" />
              )}
              {showCorrectness && isCorrect && (
                <CheckCircle2 className="size-4 text-green-600" />
              )}
              {showCorrectness && isWrong && (
                <XCircle className="size-4 text-red-500" />
              )}
              {showCorrectness && !isCorrect && !isWrong && (
                <MinusCircle className="size-4 text-muted-foreground" />
              )}
            </span>
            <span className="flex-1">
              <PlateReadOnlyViewer value={choice.text} />
            </span>
            {showCorrectness && isCorrect && (
              <span className="text-xs text-green-600 font-medium shrink-0 mt-0.5">
                {labels.correct}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Shared read-only card for displaying a question with its participant answer.
 * Pass a `scoreControl` ReactNode (client component) to make the score editable (creator view).
 */
export function QuestionDetailCard({
  questionNumber,
  questionText,
  type,
  essay,
  choice,
  multipleSelect,
  showDetailedScore,
  scoreControl,
  labels,
}: QuestionDetailCardProps) {
  const maxScore =
    essay?.maxScore ?? choice?.maxScore ?? multipleSelect?.maxScore ?? 0;
  const score = essay?.score ?? choice?.score ?? multipleSelect?.score ?? 0;
  const hasAnswerData = !!(essay || choice || multipleSelect);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-muted-foreground">
              Q{questionNumber}
            </span>
            <TypeBadge type={type} labels={labels} />
          </div>
          {showDetailedScore && !scoreControl && hasAnswerData && (
            <ScoreBadge score={score} maxScore={maxScore} />
          )}
        </div>
        {/* Question text */}
        <div className="pt-1">
          <PlateReadOnlyViewer value={questionText} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* ---- ESSAY ---- */}
        {type === "ESSAY" && essay && (
          <>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {labels.yourAnswer}
              </p>
              {essay.answerText.trim() ? (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <PlateReadOnlyViewer value={essay.answerText} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {labels.notAnswered}
                </p>
              )}
            </div>

            {essay.correctAnswer !== null && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {labels.correctAnswer}
                </p>
                <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm">
                  <PlateReadOnlyViewer value={essay.correctAnswer} />
                </div>
              </div>
            )}

            {showDetailedScore && essay.scoreExplanation && !scoreControl && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {labels.scoreExplanation}
                </p>
                <p className="text-sm text-muted-foreground">
                  {essay.scoreExplanation}
                </p>
              </div>
            )}
          </>
        )}

        {/* ---- CHOICE ---- */}
        {type === "CHOICE" && choice && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {labels.yourAnswer}
            </p>
            <ChoiceList choices={choice.choices} labels={labels} />
          </div>
        )}

        {/* ---- MULTIPLE SELECT ---- */}
        {type === "MULTIPLE_SELECT" && multipleSelect && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {labels.yourAnswer}
            </p>
            <ChoiceList choices={multipleSelect.choices} labels={labels} />
          </div>
        )}

        {/* Score control (creator edit view) */}
        {scoreControl && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {labels.score}
              </p>
              {scoreControl}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
