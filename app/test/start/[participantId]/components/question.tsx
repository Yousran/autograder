import TiptapRenderer from "@/components/custom/tiptap-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { normalizeSnakeCase } from "@/lib/text";
import type { QuestionWithAnswer } from "@/types/participant-test";

interface QuestionProps {
  question: QuestionWithAnswer;
  index: number;
}

export default function Question({ question, index }: QuestionProps) {
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
