import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EssayQuestion } from "@/types";

type EssayQuestionCardProps = {
  question: EssayQuestion;
};

const EssayQuestionCard = ({ question }: EssayQuestionCardProps) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Question</Label>
        <Textarea value={question.question} readOnly />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Answer Key</Label>
        <Textarea value={question.answerKey} readOnly />
      </div>
    </div>
  );
};

export default EssayQuestionCard;
