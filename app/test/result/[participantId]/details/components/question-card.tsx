import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { normalizeSnakeCase } from "@/lib/text";
import ChoiceComponent from "@/components/custom/choice";

interface QuestionCardProps {
  question: {
    id: string;
    order?: number;
    type: string;
    questionText: string;
    essay?: {
      participantAnswer?: {
        answerText?: string;
        score?: number | null;
        scoreExplanation?: string;
      } | null;
    } | null;
    choice?: {
      participantAnswer?: {
        selectedChoiceId?: string;
        score?: number | null;
      } | null;
      choices?: { id: string; choiceText: string }[];
    } | null;
    multipleSelect?: {
      participantAnswer?: {
        selectedChoices: { id: string; choiceText: string }[];
        score?: number | null;
      } | null;
    } | null;
  };
}

export default function QuestionCard({ question }: QuestionCardProps) {
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
            <Label className="text-lg font-bold">Participant Choice</Label>
            <div className="flex flex-col gap-2">
              {question.choice.choices?.map((choice) =>
                choice.id ===
                question.choice?.participantAnswer?.selectedChoiceId ? (
                  <ChoiceComponent
                    key={choice.id}
                    choice={{
                      ...choice,
                      isCorrect: false,
                      questionId: "",
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }}
                  />
                ) : null
              )}
            </div>
          </div>
        )}
        {question.type === "MULTIPLE_SELECT" && question.multipleSelect && (
          <div className="flex flex-col gap-2">
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
                        isCorrect: false,
                        questionId: "",
                        createdAt: new Date(),
                        updatedAt: new Date(),
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
        <Label className="text-lg font-bold">Score</Label>
        <Label className="text-sm font-normal text-primary">
          {question.essay?.participantAnswer?.score ??
            question.choice?.participantAnswer?.score ??
            question.multipleSelect?.participantAnswer?.score ??
            0}
        </Label>
      </CardContent>
    </Card>
  );
}
