import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { normalizeSnakeCase } from "@/lib/text";
import ChoiceComponent from "@/components/custom/choice";
import ScoreProgress from "@/components/custom/score-progress";
import type { QuestionAnswerDetail } from "@/types/answer";

interface ResultQuestionCardProps {
  question: QuestionAnswerDetail;
  showCorrectAnswers: boolean;
}

export function ResultQuestionCard({
  question,
  showCorrectAnswers,
}: ResultQuestionCardProps) {
  const getScore = () => {
    if (question.essay?.participantAnswer) {
      return question.essay.participantAnswer.score;
    }
    if (question.choice?.participantAnswer) {
      return question.choice.participantAnswer.score;
    }
    if (question.multipleSelect?.participantAnswer) {
      return question.multipleSelect.participantAnswer.score;
    }
    return 0;
  };

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
        {/* Question text */}
        <div className="border-b-2 border-b-secondary pb-4">
          <TiptapRenderer content={question.questionText} />
        </div>

        {/* Essay question */}
        {question.type === "ESSAY" && question.essay && (
          <div className="flex flex-col gap-4">
            {showCorrectAnswers && (
              <>
                <Label className="text-lg font-bold">Correct Answer</Label>
                <Label className="text-sm font-normal text-muted-foreground whitespace-pre-wrap">
                  {question.essay.answerText}
                </Label>
              </>
            )}
            <Label className="text-lg font-bold">Participant Answer</Label>
            <Label className="text-sm font-normal text-primary whitespace-pre-wrap">
              {question.essay.participantAnswer?.answerText ||
                "No answer provided"}
            </Label>
            {question.essay.participantAnswer?.scoreExplanation && (
              <>
                <Label className="text-lg font-bold">Score Explanation</Label>
                <Label className="text-sm font-normal text-muted-foreground whitespace-pre-wrap">
                  {question.essay.participantAnswer.scoreExplanation}
                </Label>
              </>
            )}
          </div>
        )}

        {/* Choice question */}
        {question.type === "CHOICE" && question.choice && (
          <div className="flex flex-col gap-4">
            {showCorrectAnswers && (
              <>
                <Label className="text-lg font-bold">All Choices</Label>
                <div className="flex flex-col gap-2">
                  {question.choice.choices.map((choice) => (
                    <ChoiceComponent
                      key={choice.id}
                      isCorrect={choice.isCorrect}
                    >
                      {choice.choiceText}
                    </ChoiceComponent>
                  ))}
                </div>
              </>
            )}
            <Label className="text-lg font-bold">Participant Choice</Label>
            <div className="flex flex-col gap-2">
              {question.choice.choices
                .filter(
                  (choice) =>
                    choice.id ===
                    question.choice?.participantAnswer?.selectedChoiceId
                )
                .map((choice) => (
                  <ChoiceComponent
                    key={choice.id}
                    isCorrect={showCorrectAnswers ? choice.isCorrect : false}
                  >
                    {choice.choiceText}
                  </ChoiceComponent>
                ))}
              {!question.choice.participantAnswer?.selectedChoiceId && (
                <Label className="text-sm font-normal text-muted-foreground">
                  No answer provided
                </Label>
              )}
            </div>
          </div>
        )}

        {/* Multiple select question */}
        {question.type === "MULTIPLE_SELECT" && question.multipleSelect && (
          <div className="flex flex-col gap-4">
            {showCorrectAnswers && (
              <>
                <Label className="text-lg font-bold">All Choices</Label>
                <div className="flex flex-col gap-2">
                  {question.multipleSelect.multipleSelectChoices.map(
                    (choice) => (
                      <ChoiceComponent
                        key={choice.id}
                        isCorrect={choice.isCorrect}
                      >
                        {choice.choiceText}
                      </ChoiceComponent>
                    )
                  )}
                </div>
              </>
            )}
            <Label className="text-lg font-bold">Participant Choices</Label>
            <div className="flex flex-col gap-2">
              {question.multipleSelect.participantAnswer?.selectedChoices
                .length ? (
                question.multipleSelect.participantAnswer.selectedChoices.map(
                  (choice) => (
                    <ChoiceComponent
                      key={choice.id}
                      isCorrect={showCorrectAnswers ? choice.isCorrect : false}
                    >
                      {choice.choiceText}
                    </ChoiceComponent>
                  )
                )
              ) : (
                <Label className="text-sm font-normal text-muted-foreground">
                  No answer provided
                </Label>
              )}
            </div>
          </div>
        )}

        {/* Score progress */}
        <ScoreProgress score={getScore()} maxScore={question.maxScore} />
      </CardContent>
    </Card>
  );
}
