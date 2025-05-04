// file: /app/test/[joinCode]/start/components/answer.tsx
import { Card } from "@/components/ui/card";
import { QuestionWithAnswers } from "../participant-response";
import EssayAnswer from "./essay-answer";
import ChoiceAnswer from "./choice-answer";
import MultipleSelectAnswer from "./multiple-select-answer";

export default function Answer({
  question,
  setQuestion,
}: {
  question: QuestionWithAnswers;
  setQuestion: (updatedQuestion: QuestionWithAnswers) => void;
}) {
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
