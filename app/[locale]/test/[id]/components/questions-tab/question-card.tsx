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

export type QuestionItem = {
  id: string;
  title: string;
};

interface QuestionCardProps {
  question: QuestionItem;
  index: number;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
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
          <Select defaultValue="essay">
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essay">Essay</SelectItem>
              <SelectItem value="choice">Choice</SelectItem>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" size="icon">
            <Trash2Icon />
          </Button>
        </div>
      </Card>
    </SortableItem>
  );
}
