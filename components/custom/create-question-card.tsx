"use client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CreateQuestionCard = ({ 
  question, 
  onUpdate, 
  onDelete 
}: { 
  question: { text: string; type: "essay" | "multipleChoice"; choices: string[]; correctChoiceIndex: number | null; answerKey: string }; 
  onUpdate: (newData: Partial<typeof question>) => void; 
  onDelete: () => void; 
}) => {
  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...question.choices];
    newChoices[index] = value;
    onUpdate({ choices: newChoices });
  };

  const handleAddChoice = () => onUpdate({ choices: [...question.choices, ""] });

  const handleRemoveChoice = (index: number) => {
    const newChoices = question.choices.filter((_, i) => i !== index);
    onUpdate({ choices: newChoices, correctChoiceIndex: question.correctChoiceIndex === index ? null : question.correctChoiceIndex });
  };

  return (
    <Card>
      <CardHeader>
        <Textarea 
          placeholder="Question" 
          className="mb-4" 
          value={question.text} 
          onChange={(e) => onUpdate({ text: e.target.value })} 
        />
      </CardHeader>
      <CardContent>
        <Label>Question Type</Label>
        <Select value={question.type} onValueChange={(value) => onUpdate({ type: value as "essay" | "multipleChoice" })}>
          <SelectTrigger>
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
            <SelectItem value="essay">Essay</SelectItem>
          </SelectContent>
        </Select>

        {question.type === "essay" && (
          <div className="mt-4">
            <Label>Answer Key</Label>
            <Textarea value={question.answerKey} onChange={(e) => onUpdate({ answerKey: e.target.value })} placeholder="Enter the correct answer" />
          </div>
        )}

        {question.type === "multipleChoice" && (
          <div className="mt-4 space-y-2">
            <Label>Choices</Label>
            {question.choices.map((choice, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input value={choice} onChange={(e) => handleChoiceChange(index, e.target.value)} placeholder={`Choice ${index + 1}`} />
                <Button 
                  variant={question.correctChoiceIndex === index ? "default" : "outline"} 
                  onClick={() => onUpdate({ correctChoiceIndex: index })} 
                  className="p-2"
                >
                  <i className={`bx ${question.correctChoiceIndex === index ? "bxs-check-circle" : "bx-check-circle"} text-lg`} />
                </Button>
                <Button variant="destructive" onClick={() => handleRemoveChoice(index)} className="p-2">
                  <i className="bx bx-trash text-lg" />
                </Button>
              </div>
            ))}
            <Button onClick={handleAddChoice} className="w-full">
              <i className="bx bx-plus-circle text-lg mr-2" />
              Add Choice
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="destructive" onClick={onDelete}>
          <i className="bx bx-trash text-lg mr-2" />
          Delete Question
        </Button>
      </CardFooter>
    </Card>
  );
};