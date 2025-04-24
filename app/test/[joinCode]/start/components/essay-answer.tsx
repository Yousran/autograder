import { CardContent } from "@/components/ui/card";
import { QuestionWithAnswers } from "../participant-response";
import { Textarea } from "@/components/ui/textarea";

export default function EssayAnswer({
  question,
  setQuestion,
}: {
  question: QuestionWithAnswers;
  setQuestion: (updatedQuestion: QuestionWithAnswers) => void;
}) {
  const handleChange = (newAnswer: string) => {
    if (!question.essay?.id) {
      console.error("essay.id is undefined");
      return;
    }

    const updatedQuestion = {
      ...question,
      essay: {
        ...question.essay,
        answer: {
          ...question.essay?.answer,
          answerText: newAnswer,
        },
      },
    };
    setQuestion(updatedQuestion);
  };

  return (
    <CardContent>
      <Textarea
        placeholder="Answer"
        className="w-full min-h-32"
        maxLength={500}
        value={question.essay?.answer.answerText}
        onChange={(event) => handleChange(event.target.value)}
      />
    </CardContent>
  );
}
