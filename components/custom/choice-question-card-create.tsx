// components/custom/choice-question-card-create.tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChoiceQuestion } from "@/types";

type ChoiceQuestionCardCreateProps = {
  question: ChoiceQuestion;
  onUpdate: (question: ChoiceQuestion) => void;
};

const ChoiceQuestionCardCreate = ({ question, onUpdate }: ChoiceQuestionCardCreateProps) => {
  const handleQuestionChange = (value: string) => {
    onUpdate({
      ...question,
      question: value
    });
  };

  const handleChoiceTextChange = (id: number, value: string) => {
    const updatedChoices = question.choices.map(choice =>
      choice.id === id ? { ...choice, text: value } : choice
    );
    onUpdate({ ...question, choices: updatedChoices });
  };

  const handleMarkCorrect = (id: number) => {
    const updatedChoices = question.choices.map(choice => ({
      ...choice,
      isCorrect: choice.id === id,
    }));
    onUpdate({ ...question, choices: updatedChoices });
  };

  const addChoice = () => {
    const newChoiceId = question.choices.length > 0
      ? Math.max(...question.choices.map(c => c.id)) + 1
      : 1;
    onUpdate({
      ...question,
      choices: [...question.choices, { id: newChoiceId, text: '', isCorrect: false }]
    });
  };

  const deleteChoice = (id: number) => {
    onUpdate({
      ...question,
      choices: question.choices.filter(c => c.id !== id)
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
          onChange={(e) => handleQuestionChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Choices</Label>
        <div className="flex flex-col gap-4">
          {question.choices.map((choice) => (
            <div key={choice.id} className="w-full flex items-center gap-2">
              <Input
                placeholder="Enter choice text"
                value={choice.text}
                onChange={(e) => handleChoiceTextChange(choice.id, e.target.value)}
                className="flex-1"
              />
              <Button
                variant={choice.isCorrect ? "default" : "outline"}
                className="w-20"
                onClick={() => handleMarkCorrect(choice.id)}
              >
                {choice.isCorrect ? "Correct" : "Mark"}
              </Button>
              <Button
                variant="destructive"
                className="w-20"
                onClick={() => deleteChoice(choice.id)}
              >
                Delete
              </Button>
            </div>
          ))}
          <Button className="w-full" onClick={addChoice}>
            Add Choice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChoiceQuestionCardCreate;
