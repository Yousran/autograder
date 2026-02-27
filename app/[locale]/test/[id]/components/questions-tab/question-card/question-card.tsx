"use client";

import { GripVerticalIcon, Trash } from "lucide-react";
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
import { EditableTextarea } from "@/components/custom/editable-textarea";
import { QUESTION_TYPES, getQuestionTypeLabel } from "@/lib/schemas/question";
import type { QuestionWithDetails } from "@/lib/schemas/question";
import { QuestionType } from "@/lib/generated/prisma/enums";
import { QuestionChoice } from "./question-choice";
import { QuestionMultipleChoice } from "./question-multiple-choice";
import { QuestionEssay } from "./question-essay";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuestionCardProps {
  question: QuestionWithDetails;
  index: number;
  onDelete: (id: string) => void;
  onTypeChange?: (type: QuestionType) => void;
  loadChoices?: boolean;
}

export function QuestionCard({
  question,
  index,
  onDelete,
  onTypeChange,
  loadChoices,
}: QuestionCardProps) {
  const t = useTranslations("Components.questionsTab");

  const handleQuestionTextUpdate = async (newText: string) => {
    await fetch(`/api/questions/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText: newText,
        type: question.type,
      }),
    });
  };

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
          <Select defaultValue={question.type} onValueChange={onTypeChange}>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDelete(question.id)}
                >
                  <Trash />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("deleteQuestion")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          <EditableTextarea
            initialValue={question.questionText}
            onUpdate={handleQuestionTextUpdate}
            placeholder={t("questionTextPlaceholder")}
            className="min-h-24"
            onUpdateError={(error) => {
              console.error("Failed to update question text:", error);
            }}
          />
        </div>
        {question.type === QuestionType.CHOICE &&
          (typeof loadChoices === "undefined" || loadChoices) && (
            <QuestionChoice questionId={question.id} />
          )}
        {question.type === QuestionType.MULTIPLE_SELECT && (
          <QuestionMultipleChoice />
        )}
        {question.type === QuestionType.ESSAY && (
          <QuestionEssay
            questionId={question.id}
            answerText={question.essay?.answerText}
            isExactAnswer={question.essay?.isExactAnswer}
            maxScore={question.essay?.maxScore}
          />
        )}
      </Card>
    </SortableItem>
  );
}
