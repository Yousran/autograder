import { CardContent } from "@/components/ui/card";
import { QuestionWithAnswers } from "../participant-response";
import { Button } from "@/components/ui/button";

export default function MultipleChoiceAnswer({
  question,
  setQuestion,
}: {
  question: QuestionWithAnswers;
  setQuestion: (updatedQuestion: QuestionWithAnswers) => void;
}) {
  const handleClick = (choiceId: string) => {
    if (!question.multipleChoice) {
      console.error("Multiple choice question is undefined");
      return;
    }

    const currentAnswer = question.multipleChoice.answer;
    const currentSelected = currentAnswer.selectedChoices;

    // Find the complete choice object from available choices
    const selectedChoice = question.multipleChoice.multipleChoices.find(
      (choice) => choice.id === choiceId
    );

    if (!selectedChoice) {
      console.error("Selected choice not found in available options");
      return;
    }

    const isAlreadySelected = currentSelected.some(
      (choice) => choice.id === choiceId
    );

    const updatedSelected = isAlreadySelected
      ? currentSelected.filter((choice) => choice.id !== choiceId)
      : [...currentSelected, selectedChoice];

    const updatedQuestion: QuestionWithAnswers = {
      ...question,
      multipleChoice: {
        ...question.multipleChoice,
        answer: {
          ...currentAnswer,
          selectedChoices: updatedSelected,
        },
      },
    };

    setQuestion(updatedQuestion);
  };

  return (
    <CardContent className="flex flex-col gap-2">
      {question.multipleChoice?.multipleChoices.map((choice) => {
        const isSelected = question.multipleChoice?.answer.selectedChoices.some(
          (selectedChoice) => selectedChoice.id === choice.id
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
