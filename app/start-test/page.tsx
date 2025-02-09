// app/start-test/page.tsx
"use client";

import { useState, useEffect, FC } from "react";
import { useSearchParams } from "next/navigation";
import TestQuestion from "@/components/custom/test-question";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Choice = {
  id: number;
  choice_text: string;
};

export type Question = {
  id: number;
  question: string;
  type: "essay" | "choice";
  Choices?: Choice[];
};

export type TestData = {
  test_title: string;
  test_duration: number;
  questions: Question[];
};

const TestStartPage: FC = () => {
  // Ambil query parameter: participantId, testId, startTime
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const testId = searchParams.get("testId");
  const startTime = searchParams.get("startTime");

  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [markedQuestions, setMarkedQuestions] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<Record<number, string | number>>({});

  useEffect(() => {
    if (!testId) return;

    const fetchTestData = async () => {
      try {
        // Panggil API route berdasarkan testId
        const response = await fetch(`/api/v1/test/start?testId=${testId}`);
        if (!response.ok) throw new Error("Failed to fetch test data");
        const data = await response.json();
        setTestData(data.test);
      } catch (error) {
        console.error(error);
      }
    };

    fetchTestData();
  }, [testId]);

  // Handler untuk perubahan jawaban di tiap soal
  const handleAnswerChange = (questionId: number, answer: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (testData && currentIndex < testData.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleMark = () => {
    setMarkedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  // Handler untuk menyelesaikan test (selanjutnya dapat mengirim data ke API submit)
  const handleFinish = async () => {
    const participantData = { id: participantId, test_id: testId, startTime };
    // Siapkan payload berdasarkan tipe soal
    const essayAnswers =
      testData?.questions
        .filter((q) => q.type === "essay")
        .map((q) => ({
          essay_question_id: q.id,
          answer: (answers[q.id] as string) || "",
        })) || [];

    const choiceAnswers =
      testData?.questions
        .filter((q) => q.type === "choice")
        .map((q) => ({
          choice_question_id: q.id,
          choice_id: (answers[q.id] as number) || null,
        })) || [];

    const payload = {
      participant_id: participantData.id,
      essayAnswers,
      choiceAnswers,
    };

    console.log("Submit payload:", payload);

    // Contoh pengiriman data ke API backend
    // try {
    //   const response = await fetch(`/api/v1/test/submit`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(payload),
    //   });
    //   if (!response.ok) {
    //     throw new Error("Submit test failed");
    //   }
    //   // Tindak lanjut jika berhasil
    // } catch (error) {
    //   console.error(error);
    // }
  };

  if (!testData) {
    return <div className="p-4">Loading...</div>;
  }

  // Ambil soal yang sedang aktif berdasarkan currentIndex
  const currentQuestion = testData.questions[currentIndex];

  return (
    <div className="flex flex-col justify-between min-h-screen">
      <Sheet>
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">{testData.test_title}</h1>
          <SheetTrigger asChild>
            <Button variant="default">List</Button>
          </SheetTrigger>
        </div>
        <SheetContent>
          <SheetTitle>Question List</SheetTitle>
          <div className="p-4">
            {testData.questions.map((_, index) => (
              <button
                key={index}
                className={`w-full p-2 border rounded mb-2 ${
                  index === currentIndex
                    ? "bg-primary text-white"
                    : markedQuestions[index]
                    ? "bg-yellow-300"
                    : ""
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                Question {index + 1}
              </button>
            ))}
          </div>
        </SheetContent>
        <div className="flex justify-center h-auto w-full p-4">
          <TestQuestion
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        </div>
        <div className="flex justify-between items-center p-4">
          <Button variant="default" onClick={handlePrev} disabled={currentIndex === 0}>
            Prev
          </Button>
          <Button variant={markedQuestions[currentIndex] ? "warning" : "default"} onClick={handleMark}>
            {markedQuestions[currentIndex] ? "Unmark" : "Mark"}
          </Button>
          {currentIndex === testData.questions.length - 1 ? (
            <Button variant="default" onClick={handleFinish}>
              Finish
            </Button>
          ) : (
            <Button variant="default" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
};

export default TestStartPage;