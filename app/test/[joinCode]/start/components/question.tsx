// file: /app/test/[joinCode]/start/components/question.tsx
import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QuestionWithAnswers } from "../participant-response";
import { normalizeSnakeCase } from "@/lib/text";

export default function Question({
  question,
  index,
}: {
  question: QuestionWithAnswers;
  index: number;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <Label className="text-2xl font-bold">{index}</Label>
        <Label className="text-2xl font-bold">
          {normalizeSnakeCase(question.type)}
        </Label>
      </CardHeader>
      <CardContent>
        <TiptapRenderer content={question.questionText} />
      </CardContent>
    </Card>
  );
}
