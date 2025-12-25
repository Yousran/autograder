import React from "react";
import { Check } from "lucide-react";

type ChoiceProps = {
  isCorrect: boolean;
  choiceText: string;
};

const ChoiceComponent: React.FC<ChoiceProps> = ({ isCorrect, choiceText }) => {
  return (
    <div
      className={`p-4 border rounded-md ${
        isCorrect
          ? "bg-green-100/10 border-green-500"
          : "bg-card border-secondary border-2"
      }`}
    >
      <div className="flex items-center">
        <span className="grow">{choiceText}</span>
        {isCorrect && (
          <span className="text-green-500 ml-2">
            <Check className="w-5 h-5" />
          </span>
        )}
      </div>
    </div>
  );
};

export default ChoiceComponent;
