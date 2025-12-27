"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { Trash2 } from "lucide-react";

type QuestionCardProps = {
  index: number;
  onDelete: () => void;
};

export function QuestionCard({ index, onDelete }: QuestionCardProps) {
  const { watch, setValue, trigger } = useFormContext();
  const questionType = watch(`questions.${index}.type`);

  const handleTypeChange = (newType: QuestionType) => {
    // TODO: Implement type change logic
    setValue(`questions.${index}.type`, newType);
    trigger(`questions.${index}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Label className="text text-center font-bold text-2xl">
            {index + 1}
          </Label>
          <Select
            value={questionType}
            onValueChange={(val) => handleTypeChange(val as QuestionType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={QuestionType.ESSAY}>Essay</SelectItem>
              <SelectItem value={QuestionType.CHOICE}>Choice</SelectItem>
              <SelectItem value={QuestionType.MULTIPLE_SELECT}>
                Multiple Select
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={onDelete} type="button">
            <Trash2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {questionType === QuestionType.ESSAY && (
          <div>Essay Question Card - Placeholder</div>
        )}
        {questionType === QuestionType.CHOICE && (
          <div>Choice Question Card - Placeholder</div>
        )}
        {questionType === QuestionType.MULTIPLE_SELECT && (
          <div>Multiple Select Question Card - Placeholder</div>
        )}
      </CardContent>
    </Card>
  );
}
