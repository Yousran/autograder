// components/custom/essay-question-card-create.tsx
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EssayQuestion } from "@/types";

type EssayQuestionCardCreateProps = {
  question: EssayQuestion;
  onUpdate: (question: EssayQuestion) => void;
};

const EssayQuestionCardCreate = ({ question, onUpdate }: EssayQuestionCardCreateProps) => {
  const handleChange = (field: keyof EssayQuestion, value: string) => {
    onUpdate({
      ...question,
      [field]: value
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          placeholder="Enter the question"
          value={question.question}
          onChange={(e) => handleChange('question', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="answerKey">Answer Key</Label>
        <Textarea
          id="answerKey"
          placeholder="Enter the answer key"
          value={question.answerKey}
          onChange={(e) => handleChange('answerKey', e.target.value)}
        />
      </div>
    </div>
  );
};

export default EssayQuestionCardCreate;