import { Card, CardContent } from "@/components/ui/card";
import EssayQuestionCard from "./essay-question-card";
import ChoiceQuestionCard from "./choice-question-card";
import { Question } from "@/types";

type QuestionCardProps = {
  question: Question;
};

const QuestionCard = ({ question }: QuestionCardProps) => {
  return (
    <Card className="w-full shadow-lg rounded-2xl">
      <CardContent className="flex flex-col gap-4 p-4">
        {question.type === "essay" ? (
          <EssayQuestionCard question={question} />
        ) : (
          <ChoiceQuestionCard question={question} />
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
