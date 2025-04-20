import React from "react";
import { Choice, MultipleChoice } from "@/types/question";
import { Check } from "lucide-react"; // Import the Lucide icon

type ChoiceProps = {
  choice: Choice | MultipleChoice;
};

const ChoiceComponent: React.FC<ChoiceProps> = ({ choice }) => {
  return (
    <div
      className={`p-4 border rounded-md ${
        choice.isCorrect
          ? "bg-green-100 border-green-500"
          : "bg-card border-secondary border-2"
      }`}
    >
      <div className="flex items-center">
        <span className="flex-grow">{choice.choiceText}</span>
        {choice.isCorrect && (
          <span className="text-green-500 ml-2">
            <Check className="w-5 h-5" />
          </span>
        )}
      </div>
    </div>
  );
};

export default ChoiceComponent;
