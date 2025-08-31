import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { normalizeSnakeCase } from "@/lib/text";
import ChoiceComponent from "@/components/custom/choice";
import { Choice, MultipleSelectChoice } from "@/types/question";
import ScoreProgress from "@/components/custom/score-progress";

interface QuestionCardProps {
  question: {
    id: string;
    order?: number;
    type: string;
    questionText: string;
    maxScore: number;
    essay?: {
      participantAnswer?: {
        answerText?: string;
        score?: number | null;
        scoreExplanation?: string;
      } | null;
      answerText: string;
    } | null;
    choice?: {
      participantAnswer?: {
        selectedChoiceId?: string;
        score?: number | null;
      } | null;
      choices?: Choice[];
    } | null;
    multipleSelect?: {
      participantAnswer?: {
        selectedChoices: MultipleSelectChoice[];
        score?: number | null;
      } | null;
      multipleSelectChoices?: MultipleSelectChoice[];
    } | null;
  };
  showCorrectAnswers: boolean;
}

export default function QuestionCard({
  question,
  showCorrectAnswers,
}: QuestionCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Label className="text-lg font-bold">{question.order}</Label>
          <Label className="text-lg font-bold text-center">
            {normalizeSnakeCase(question.type)}
          </Label>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="border-b-2 border-b-secondary">
          <TiptapRenderer content={question.questionText} />
        </div>
        {question.type === "ESSAY" && question.essay && (
          <div className="flex flex-col gap-2">
            {showCorrectAnswers && (
              <>
                <Label className="text-lg font-bold">Correct Answer</Label>
                <Label className="text-sm font-normal text-primary">
                  {question.essay.answerText}
                </Label>
              </>
            )}
            <Label className="text-lg font-bold">Participant Answer</Label>
            <Label className="text-sm font-normal text-primary">
              {question.essay.participantAnswer?.answerText ||
                "No answer provided"}
            </Label>
            {question.essay.participantAnswer?.scoreExplanation && (
              <>
                <Label className="text-lg font-bold">Score Explanation</Label>
                <Label className="text-sm font-normal text-primary">
                  {question.essay.participantAnswer.scoreExplanation}
                </Label>
              </>
            )}
          </div>
        )}
        {question.type === "CHOICE" && question.choice && (
          <div className="flex flex-col gap-2">
            {showCorrectAnswers && (
              <>
                <Label className="text-lg font-bold">Choices</Label>
                <div className="flex flex-col gap-2">
                  {question.choice.choices?.map((choice) => (
                    <ChoiceComponent key={choice.id} choice={choice} />
                  ))}
                </div>
              </>
            )}
            <Label className="text-lg font-bold">Participant Choice</Label>
            <div className="flex flex-col gap-2">
              {question.choice.choices?.map((choice) =>
                choice.id ===
                question.choice?.participantAnswer?.selectedChoiceId ? (
                  <ChoiceComponent
                    key={choice.id}
                    choice={{
                      ...choice,
                      isCorrect: showCorrectAnswers ? choice.isCorrect : false,
                    }}
                  />
                ) : null
              )}
            </div>
          </div>
        )}
        {question.type === "MULTIPLE_SELECT" && question.multipleSelect && (
          <div className="flex flex-col gap-2">
            {showCorrectAnswers && (
              <>
                <Label className="text-lg font-bold">Choices</Label>
                <div className="flex flex-col gap-2">
                  {question.multipleSelect.multipleSelectChoices?.map(
                    (choice) => (
                      <ChoiceComponent key={choice.id} choice={choice} />
                    )
                  )}
                </div>
              </>
            )}
            <Label className="text-lg font-bold">Participant Choices</Label>
            <div className="flex flex-col gap-2">
              {question.multipleSelect.participantAnswer?.selectedChoices
                ?.length ? (
                question.multipleSelect.participantAnswer.selectedChoices.map(
                  (choice) => (
                    <ChoiceComponent
                      key={choice.id}
                      choice={{
                        ...choice,
                        isCorrect: showCorrectAnswers
                          ? choice.isCorrect
                          : false,
                      }}
                    />
                  )
                )
              ) : (
                <Label className="text-sm font-normal text-primary">
                  No answer provided
                </Label>
              )}
            </div>
          </div>
        )}
        <ScoreProgress
          score={
            question.essay?.participantAnswer?.score ??
            question.choice?.participantAnswer?.score ??
            question.multipleSelect?.participantAnswer?.score ??
            0
          }
          maxScore={question.maxScore}
        />
      </CardContent>
    </Card>
  );
}
