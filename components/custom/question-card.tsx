"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const QuestionCard = ({ question }: { 
  question: { 
    text: string; 
    type: "essay" | "multipleChoice"; 
    choices?: { id: number; choice_text: string; is_right: boolean }[];
    answerKey?: string;
  };
}) => {
  return (
    <Card>
      <CardHeader>
        <p className="text-lg font-semibold">{question.text}</p>
      </CardHeader>
      <CardContent>
        <Label className="text-gray-600">Question Type: {question.type === "essay" ? "Essay" : "Multiple Choice"}</Label>
        
        {question.type === "essay" && question.answerKey && (
          <div className="mt-4">
            <Label className="text-gray-600">Answer Key:</Label>
            <p className="text-gray-800 border p-2 rounded-md bg-gray-100">{question.answerKey}</p>
          </div>
        )}
        
        {question.type === "multipleChoice" && question.choices && (
          <div className="mt-4 space-y-2">
            <Label className="text-gray-600">Choices:</Label>
            {question.choices.map((choice) => (
              <div key={choice.id} className={`p-2 border rounded-md ${choice.is_right ? "bg-green-100" : "bg-gray-100"}`}>
                <span className={`${choice.is_right ? "text-green-600 font-semibold" : "text-gray-800"}`}>{choice.choice_text}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
