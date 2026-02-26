"use client";

import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemContent,
  ChoiceboxItemHeader,
  ChoiceboxItemIndicator,
  ChoiceboxItemTitle,
} from "@/components/ui/choicebox";
import { Badge } from "@/components/ui/badge";

interface QuestionMultipleChoiceProps {
  choices?: Array<{
    id: string;
    choiceText: string;
    isCorrect: boolean;
  }>;
}

export function QuestionMultipleChoice({
  choices = [],
}: QuestionMultipleChoiceProps) {
  if (choices.length === 0) {
    return (
      <Choicebox disabled className="mt-4">
        <ChoiceboxItem value="placeholder-1" disabled>
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle>Option 1</ChoiceboxItemTitle>
          </ChoiceboxItemHeader>
          <ChoiceboxItemContent>
            <ChoiceboxItemIndicator />
          </ChoiceboxItemContent>
        </ChoiceboxItem>
        <ChoiceboxItem value="placeholder-2" disabled>
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle>Option 2</ChoiceboxItemTitle>
          </ChoiceboxItemHeader>
          <ChoiceboxItemContent>
            <ChoiceboxItemIndicator />
          </ChoiceboxItemContent>
        </ChoiceboxItem>
        <ChoiceboxItem value="placeholder-3" disabled>
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle>Option 3</ChoiceboxItemTitle>
          </ChoiceboxItemHeader>
          <ChoiceboxItemContent>
            <ChoiceboxItemIndicator />
          </ChoiceboxItemContent>
        </ChoiceboxItem>
      </Choicebox>
    );
  }

  return (
    <Choicebox disabled className="mt-4">
      {choices.map((choice) => (
        <ChoiceboxItem key={choice.id} value={choice.id} disabled>
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle className="flex items-center gap-2">
              {choice.choiceText}
              {choice.isCorrect && (
                <Badge
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Correct
                </Badge>
              )}
            </ChoiceboxItemTitle>
          </ChoiceboxItemHeader>
          <ChoiceboxItemContent>
            <ChoiceboxItemIndicator />
          </ChoiceboxItemContent>
        </ChoiceboxItem>
      ))}
    </Choicebox>
  );
}
