import { Card, CardContent } from "@/components/ui/card";
import EssayQuestionCardStart from "@/components/custom/essay-question-card-start";
import ChoiceQuestionCardStart from "@/components/custom/choice-question-card-start";

export type EssayQuestion = {
  id: number;
  type: "essay";
  question: string;
  answerKey: string;
  answer: string;
  score: number | null;
  isMarked: boolean;
};

export type ChoiceQuestion = {
  id: number;
  type: "choice";
  question: string;
  choices: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
  selectedChoiceId: number | null;
  selectedChoiceText: string | null;
  score: number | null;
  isMarked: boolean;
};

export type Question = EssayQuestion | ChoiceQuestion;

type Props = {
  data: Question;
  onAnswerChange: (updatedQuestion: Question) => void;
  currentIndex: number;
};

export default function QuestionCardStart({
  data,
  onAnswerChange,
  currentIndex,
}: Props) {
  return (
    <Card>
      <CardContent>
        <div className="text-2xl font-bold text-center">{currentIndex + 1}</div>
        {data.type === "essay" ? (
          <EssayQuestionCardStart
            question={data.question}
            answer={data.answer}
            onChange={(newAnswer) =>
              onAnswerChange({ ...data, answer: newAnswer })
            }
          />
        ) : (
          <ChoiceQuestionCardStart
            question={data.question}
            choices={data.choices}
            selectedChoiceId={data.selectedChoiceId}
            onSelectChoice={(selectedId) =>
              onAnswerChange({ ...data, selectedChoiceId: selectedId })
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
