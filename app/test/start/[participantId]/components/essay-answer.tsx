import { CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionWithAnswer } from "@/types/participant-test";

interface EssayAnswerProps {
  question: QuestionWithAnswer;
  setQuestion: (updatedQuestion: QuestionWithAnswer) => void;
}

export default function EssayAnswer({
  question,
  setQuestion,
}: EssayAnswerProps) {
  const handleChange = (newAnswer: string) => {
    if (!question.essay?.id) {
      console.error("essay.id is undefined");
      return;
    }

    const updatedQuestion: QuestionWithAnswer = {
      ...question,
      essay: {
        ...question.essay,
        answer: {
          ...question.essay.answer,
          answerText: newAnswer,
        },
      },
    };
    setQuestion(updatedQuestion);
  };

  return (
    <CardContent>
      <Textarea
        placeholder="Type your answer here..."
        className="w-full min-h-32"
        maxLength={10000}
        value={question.essay?.answer.answerText || ""}
        onChange={(event) => handleChange(event.target.value)}
      />
    </CardContent>
  );
}
