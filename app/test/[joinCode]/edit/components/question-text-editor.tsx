"use client";

import TiptapEditor from "@/components/custom/tiptap-editor";
import { Label } from "@/components/ui/label";

type QuestionTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function QuestionTextEditor({
  value,
  onChange,
  placeholder = "Write the question...",
}: QuestionTextEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Question</Label>
      <TiptapEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
