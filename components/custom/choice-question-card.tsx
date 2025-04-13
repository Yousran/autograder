import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChoiceQuestion } from "@/types";

type ChoiceQuestionCardProps = {
  question: ChoiceQuestion;
};

const ChoiceQuestionCard = ({ question }: ChoiceQuestionCardProps) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Question</Label>
        <Input value={question.question} readOnly />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Choices</Label>
        <div className="flex flex-col gap-2">
          {question.choices.map((choice) => (
            <div
              key={choice.id}
              className={`p-2 rounded border ${choice.isCorrect ? "border-green-500 bg-green-50" : "border-gray-200"}`}
            >
              <span>{choice.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChoiceQuestionCard;
