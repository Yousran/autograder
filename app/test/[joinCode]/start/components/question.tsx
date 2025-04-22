// file: /app/test/[joinCode]/start/components/question.tsx
import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QuestionWithAnswers } from "../participant-response";

export default function Question({
  question,
}: {
  question: QuestionWithAnswers;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <Label className="text-2xl font-bold">{question.order}</Label>
        <Label className="text-2xl font-bold">{question.type}</Label>
      </CardHeader>
      <CardContent>
        <TiptapRenderer content={question.questionText} />
      </CardContent>
    </Card>
  );
}
