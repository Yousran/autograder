// file: /app/test/[joinCode]/start/components/answer.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { QuestionWithAnswers } from "../participant-response";
import { Button } from "@/components/ui/button";

export default function Answer({
  question,
}: {
  question: QuestionWithAnswers;
}) {
  return (
    <Card>
      {question.type === "ESSAY" && (
        <CardContent>
          <Textarea
            placeholder="Answer"
            className="w-full min-h-32"
            maxLength={500}
            value={question.essay?.answers.answerText}
          />
        </CardContent>
      )}
      {question.type === "CHOICE" && (
        <CardContent className="flex flex-col gap-2">
          {question.choice?.choices.map((choice) => {
            return <Button key={choice.id}>{choice.choiceText}</Button>;
          })}
        </CardContent>
      )}

      {question.type === "MULTIPLE_CHOICE" && (
        <CardContent className="flex flex-col gap-2">
          {question.multipleChoice?.multipleChoices.map((choice) => (
            <Button key={choice.id} variant={"outline"}>
              {choice.choiceText}
            </Button>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
