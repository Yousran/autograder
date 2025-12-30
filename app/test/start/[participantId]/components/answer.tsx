import { Card } from "@/components/ui/card";
import type { QuestionWithAnswer } from "@/types/participant-test";
import EssayAnswer from "./essay-answer";
import ChoiceAnswer from "./choice-answer";
import MultipleSelectAnswer from "./multiple-select-answer";

interface AnswerProps {
  question: QuestionWithAnswer;
  setQuestion: (updatedQuestion: QuestionWithAnswer) => void;
}

export default function Answer({ question, setQuestion }: AnswerProps) {
  return (
    <Card>
      {question.type === "ESSAY" && (
        <EssayAnswer question={question} setQuestion={setQuestion} />
      )}
      {question.type === "CHOICE" && (
        <ChoiceAnswer question={question} setQuestion={setQuestion} />
      )}
      {question.type === "MULTIPLE_SELECT" && (
        <MultipleSelectAnswer question={question} setQuestion={setQuestion} />
      )}
    </Card>
  );
}
