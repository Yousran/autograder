"use client";
import { Button } from "@/components/ui/button";
import { CreateQuestionCard } from "@/components/custom/create-question-card";

export const CreateQuestion = ({ 
  questions, 
  addQuestion, 
  updateQuestion, 
  removeQuestion 
}: { 
  questions: { id: number; text: string; type: "essay" | "multipleChoice"; choices: string[]; correctChoiceIndex: number | null; answerKey: string }[]; 
  addQuestion: () => void; 
  updateQuestion: (index: number, newData: Partial<typeof questions[0]>) => void;
  removeQuestion: (index: number) => void; 
}) => {
  return (
    <div className="space-y-4">
      {questions.map((q, index) => (
        <CreateQuestionCard 
          key={q.id} 
          question={q} 
          onUpdate={(newData) => updateQuestion(index, newData)} 
          onDelete={() => removeQuestion(index)} 
        />
      ))}
      <Button onClick={addQuestion} className="w-full">
        <i className="bx bx-plus-circle text-lg mr-2" />
        Add Question
      </Button>
    </div>
  );
};
