"use client";

import { GripVerticalIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { QUESTION_TYPES, getQuestionTypeLabel } from "@/lib/schemas/question";
import type { QuestionSchema } from "@/lib/schemas/question";
export type { QuestionSchema };

interface QuestionCardProps {
  question: QuestionSchema;
  index: number;
  onDelete: (id: string) => void;
}

export function QuestionCard({ question, index, onDelete }: QuestionCardProps) {
  const t = useTranslations("Components.questionsTab");
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
              {QUESTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {getQuestionTypeLabel(type, t)}
                </SelectItem>
              ))}
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
