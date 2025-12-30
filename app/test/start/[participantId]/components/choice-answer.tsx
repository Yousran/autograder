import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuestionWithAnswer } from "@/types/participant-test";

interface ChoiceAnswerProps {
  question: QuestionWithAnswer;
  setQuestion: (updatedQuestion: QuestionWithAnswer) => void;
}

export default function ChoiceAnswer({
  question,
  setQuestion,
}: ChoiceAnswerProps) {
  const handleClick = (choiceId: string) => {
    if (!question.choice?.id) {
      console.error("choice.id is undefined");
      return;
    }

    const updatedQuestion: QuestionWithAnswer = {
      ...question,
      choice: {
        ...question.choice,
        answer: {
          ...question.choice.answer,
          selectedChoiceId: choiceId,
        },
      },
    };
    setQuestion(updatedQuestion);
  };

  return (
    <CardContent className="flex flex-col gap-2">
      {question.choice?.choices.map((choice) => (
        <Button
          key={choice.id}
          variant={
            question.choice?.answer.selectedChoiceId === choice.id
              ? "default"
              : "outline"
          }
          onClick={() => handleClick(choice.id)}
        >
          {choice.choiceText}
        </Button>
      ))}
    </CardContent>
  );
}
