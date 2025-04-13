// components/custom/essay-question-card-start.tsx

type Props = {
    question: string;
    answer: string;
    onChange: (answer: string) => void;
  };

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function EssayQuestionCardStart({ 
    question, 
    answer, 
    onChange 
  }: Props) {
    return (
      <div>
        <Label className="text font-semibold text-2xl text-center">{question}</Label>
        <Label htmlFor="essay-answer" className="text-lg font-semibold mt-4">
          Your Answer:
        </Label>
        <Input
          id="essay-answer"
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2"
          placeholder="Type your answer here"
        />
      </div>
    );
  }