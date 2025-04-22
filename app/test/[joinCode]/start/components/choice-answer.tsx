import { CardContent } from "@/components/ui/card";
import { QuestionWithAnswers } from "../participant-response";
import { Button } from "@/components/ui/button";

export default function ChoiceAnswer({
  question,
  setQuestion,
}: {
  question: QuestionWithAnswers;
  setQuestion: (updatedQuestion: QuestionWithAnswers) => void;
}) {
  const handleClick = (choiceId: string) => {
    if (!question.choice?.id) {
      console.error("choice.id is undefined");
      return;
    }

    const updatedQuestion = {
      ...question,
      choice: {
        ...question.choice,
        id: question.choice.id,
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
      {question.choice?.choices.map((choice) => {
        return (
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
        );
      })}
    </CardContent>
  );
}
