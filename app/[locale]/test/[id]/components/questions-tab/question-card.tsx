"use client";

import { GripVerticalIcon, Trash2Icon } from "lucide-react";
import { SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QuestionType } from "@/lib/generated/prisma/enums";

export type QuestionItem = {
  id: string;
  type: QuestionType;
  questionText: string;
};

interface QuestionCardProps {
  question: QuestionItem;
  index: number;
  onDelete: (id: string) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.ESSAY]: "Essay",
  [QuestionType.CHOICE]: "Choice",
  [QuestionType.MULTIPLE_SELECT]: "Multiple Choice",
};

export function QuestionCard({ question, index, onDelete }: QuestionCardProps) {
  return (
    <SortableItem value={question.id}>
      <Card className="group p-6">
        <div className="flex items-center gap-4">
          <SortableItemHandle className="text-muted-foreground hover:text-foreground relative shrink-0">
            <Label className="text-lg p-2 transition-opacity group-hover:opacity-0">
              {index + 1}
            </Label>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <GripVerticalIcon className="size-full" />
            </span>
          </SortableItemHandle>
          <Select defaultValue={question.type}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={QuestionType.ESSAY}>
                {QUESTION_TYPE_LABELS[QuestionType.ESSAY]}
              </SelectItem>
              <SelectItem value={QuestionType.CHOICE}>
                {QUESTION_TYPE_LABELS[QuestionType.CHOICE]}
              </SelectItem>
              <SelectItem value={QuestionType.MULTIPLE_SELECT}>
                {QUESTION_TYPE_LABELS[QuestionType.MULTIPLE_SELECT]}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(question.id)}
          >
            <Trash2Icon />
          </Button>
        </div>
      </Card>
    </SortableItem>
  );
}
