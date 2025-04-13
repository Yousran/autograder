// components/custom/question-card-create.tsx
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import EssayQuestionCardCreate from "./essay-question-card-create";
import ChoiceQuestionCardCreate from "./choice-question-card-create";
import { Question } from "@/types";

type QuestionCardCreateProps = {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
};

const QuestionCardCreate = ({ question, onUpdate, onDelete }: QuestionCardCreateProps) => {
  const handleTypeChange = (newType: 'essay' | 'choice') => {
    if (newType === question.type) return;
    
    const baseQuestion = {
      id: question.id,
      type: newType,
      question: question.question,
    };

    if (newType === 'essay') {
      onUpdate({
        ...baseQuestion,
        type: 'essay',
        answerKey: '',
      });
    } else {
      onUpdate({
        ...baseQuestion,
        type: 'choice',
        choices: [{ id: 1, text: '', isCorrect: false }],
      });
    }
  };

  return (
    <Card className="w-full shadow-lg rounded-2xl">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full">
                    {question.type === 'essay' ? 'Essay Question' : 'Choice Question'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleTypeChange('essay')}>
                  Essay Question
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTypeChange('choice')}>
                  Choice Question
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="col-span-1">
            <Button variant="destructive" className="w-full mb-4" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>

        {question.type === 'essay' ? (
          <EssayQuestionCardCreate
            question={question}
            onUpdate={onUpdate}
          />
        ) : (
          <ChoiceQuestionCardCreate
            question={question}
            onUpdate={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCardCreate;