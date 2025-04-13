// components/custom/choice-question-card-start.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Choice = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type Props = {
  question: string;
  choices: Choice[];
  selectedChoiceId: number | null;
  onSelectChoice: (choiceId: number) => void;
};

export default function ChoiceQuestionCardStart({
  question,
  choices,
  selectedChoiceId: initialSelectedChoiceId,
  onSelectChoice,
}: Props) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(
    initialSelectedChoiceId
  );

  useEffect(() => {
    setSelectedChoiceId(initialSelectedChoiceId);
  }, [initialSelectedChoiceId]);

  const handleChoiceClick = (choiceId: number) => {
    setSelectedChoiceId(choiceId);
    onSelectChoice(choiceId);
  };

  return (
    <div>
      <p className="text font-semibold text-2xl text-center">{question}</p>
      <div className="flex flex-col gap-2 mt-4">
        {choices.map((choice) => (
          <Button
            key={choice.id}
            variant={choice.id === selectedChoiceId ? "default" : "secondary"}
            onClick={() => handleChoiceClick(choice.id)}
          >
            {choice.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
