import { CardContent } from "@/components/ui/card";
import { QuestionWithAnswers } from "../participant-response";
import { Button } from "@/components/ui/button";

export default function MultipleSelectAnswer({
  question,
  setQuestion,
}: {
  question: QuestionWithAnswers;
  setQuestion: (updatedQuestion: QuestionWithAnswers) => void;
}) {
  const handleClick = (choiceId: string) => {
    if (!question.multipleSelect) {
      console.error("Multiple select question is undefined");
      return;
    }

    const currentAnswer = question.multipleSelect.answer;
    const currentSelected = currentAnswer.selectedChoices;

    // Find the complete choice object from available choices
    const selectedChoice = question.multipleSelect.multipleSelectChoices.find(
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
      multipleSelect: {
        ...question.multipleSelect,
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
      {question.multipleSelect?.multipleSelectChoices.map((choice) => {
        const isSelected = question.multipleSelect?.answer.selectedChoices.some(
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
