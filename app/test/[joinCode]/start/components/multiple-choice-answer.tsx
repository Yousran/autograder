import { CardContent } from "@/components/ui/card";
import { QuestionWithAnswers } from "../participant-response";
import { Button } from "@/components/ui/button";

//TODO: multiple choice answer change in database, api, and types

export default function MultipleChoiceAnswer({
  question,
  setQuestion,
}: {
  question: QuestionWithAnswers;
  setQuestion: (updatedQuestion: QuestionWithAnswers) => void;
}) {
  const handleClick = (choiceId: string) => {
    if (!question.multipleChoice?.id) {
      console.error("multipleChoice.id is undefined");
      return;
    }

    const currentAnswers = question.multipleChoice.answers || [];

    const isAlreadySelected = currentAnswers.some(
      (answer) => answer.selectedChoiceId === choiceId
    );

    const updatedAnswers = isAlreadySelected
      ? currentAnswers.filter((answer) => answer.selectedChoiceId !== choiceId)
      : [
          ...currentAnswers,
          {
            id: crypto.randomUUID(), // generate id untuk frontend, backend bisa overwrite nanti
            questionId: question.id,
            participantId: currentAnswers[0]?.participantId || "", // fallback kalau belum ada
            selectedChoiceId: choiceId,
            score: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

    const updatedQuestion: QuestionWithAnswers = {
      ...question,
      multipleChoice: {
        ...question.multipleChoice,
        answers: updatedAnswers,
      },
    };

    setQuestion(updatedQuestion);
  };

  return (
    <CardContent className="flex flex-col gap-2">
      {question.multipleChoice?.multipleChoices.map((choice) => {
        const isSelected = question.multipleChoice?.answers?.some(
          (answer) => answer.selectedChoiceId === choice.id
        );

        return (
          <Button
            key={choice.id}
            variant={isSelected ? "default" : "outline"}
            onClick={() => handleClick(choice.id)}
          >
            {choice.choiceText}
          </Button>
        );
      })}
    </CardContent>
  );
}
