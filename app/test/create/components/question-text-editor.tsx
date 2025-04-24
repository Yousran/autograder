// file: app/test/create/components/question-text-editor.tsx

"use client";

import TiptapEditor from "@/components/custom/tiptap-editor";
import { Label } from "@/components/ui/label";

type QuestionTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function QuestionTextEditor({
  value,
  onChange,
}: QuestionTextEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Question</Label>
      <TiptapEditor value={value} onChange={onChange} />
    </div>
  );
}
