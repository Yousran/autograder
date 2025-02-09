//dir: components/custom/test-question.tsx
import { FC } from "react";
import { Question } from "@/app/start-test/page";

type TestQuestionProps = {
  question: Question;
  // Nilai jawaban yang sudah tersimpan (bisa berupa string untuk essay atau number untuk choice)
  selectedAnswer?: string | number;
  // Callback untuk mengubah jawaban soal
  onAnswerChange: (answer: string | number) => void;
};

const TestQuestion: FC<TestQuestionProps> = ({ question, selectedAnswer, onAnswerChange }) => {
  return (
    <div className="flex flex-col justify-start h-auto w-full sm:w-3/5 p-4">
      <h2 className="text-lg font-bold mb-4 text-center">{question.question}</h2>
      {question.type === "choice" && question.Choices ? (
        <div className="space-y-2">
          {question.Choices.map((choice) => (
            <button
              key={choice.id}
              // Beri style khusus jika pilihan ini telah dipilih
              className={`w-full p-2 border rounded hover:bg-primary hover:text-white ${
                selectedAnswer === choice.id ? "bg-primary text-white" : ""
              }`}
              onClick={() => onAnswerChange(choice.id)}
            >
              {choice.choice_text}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Write your answer here..."
          value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
          onChange={(e) => onAnswerChange(e.target.value)}
        />
      )}
    </div>
  );
};

export default TestQuestion;
