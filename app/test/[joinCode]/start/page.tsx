// app/test/[joinCode]/start/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import TestQuestionList from "@/components/custom/test-question-list";
import QuestionCardStart from "@/components/custom/question-card-start";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";


export type EssayQuestion = {
  id: number;
  type: "essay";
  question: string;
  answerKey: string;
  answer: string;
  score: number | null;
  isMarked: boolean;
};

export type ChoiceQuestion = {
  id: number;
  type: "choice";
  question: string;
  choices: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
  selectedChoiceId: number | null;
  selectedChoiceText: string | null;
  score: number | null;
  isMarked: boolean;
};

export type Question = EssayQuestion | ChoiceQuestion;

export type TestData = {
  testTitle: string;
  testDuration: number;
  joinCode: string;
  acceptResponses: boolean;
  showDetailedScore: boolean;
  isOrdered: boolean;
  questionCount: number;
  participantId: number;
  participantUsername: string | null;
  participantCreatedAt: string;
  totalScore: number | null;
  questions: Question[];
};

export default function StartTest() {
  const { joinCode } = useParams<{ joinCode: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper: membandingkan apakah soal telah berubah
  const hasQuestionChanged = (original: Question, updated: Question): boolean => {
    if (original.type === "essay" && updated.type === "essay") {
      return original.answer !== updated.answer || original.isMarked !== updated.isMarked;
    }
    if (original.type === "choice" && updated.type === "choice") {
      return (
        original.selectedChoiceId !== updated.selectedChoiceId ||
        original.isMarked !== updated.isMarked
      );
    }
    return false;
  };

  // Update current question ke endpoint jika ada perubahan
  const updateCurrentQuestion = async (question: Question) => {
    const original = originalQuestions.find((q) => q.id === question.id);
    if (!original || !hasQuestionChanged(original, question)) return;
  
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("participant="))
      ?.split("=")[1];
  
    const handleResponse = async (res: Response) => {
      if (res.status === 403) {
        const json = await res.json();
        if (json.message === "Test doesn't accept responses") {
          router.push(`/test/${joinCode}/result`);;
          return;
        }
      }
  
      if (!res.ok) {
        throw new Error("Gagal menyimpan jawaban");
      }
    };
  
    try {
      setIsLoading(true);
      let res;
      if (question.type === "choice") {
        res = await fetch("/api/v1/answer/choice/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: question.id,
            selectedChoiceId: question.selectedChoiceId,
            isMarked: question.isMarked,
          }),
        });
      } else {
        res = await fetch("/api/v1/answer/essay/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: question.id,
            answerText: question.answer,
            isMarked: question.isMarked,
          }),
        });
      }
  
      await handleResponse(res);
  
      // Jika update berhasil, perbarui data original soal ini
      setOriginalQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...question } : q))
      );
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Error updating question:", err);
    }
  };  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/v1/participant/show", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${document.cookie
              .split("; ")
              .find((row) => row.startsWith("participant="))
              ?.split("=")[1]}`,
          },
          body: JSON.stringify({ joinCode }),
        });

        if (!res.ok) {
          const { message } = await res.json();
          throw new Error(message || "Failed to fetch test data");
        }

        const data: TestData = await res.json();
        // Pastikan setiap soal memiliki properti isMarked (default false)
        const questionsWithMark = data.questions.map((q) => ({
          ...q,
          isMarked: q.isMarked ?? false,
        }));
        setTestData({ ...data, questions: questionsWithMark });
        // Simpan deep copy untuk perbandingan update
        setOriginalQuestions(JSON.parse(JSON.stringify(questionsWithMark)));
      } catch (err) {
        console.error("Error fetching test data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [joinCode]);

  useEffect(() => {
    if (!testData) return;

    const calculateTimeLeft = () => {
      const startTime = new Date(testData.participantCreatedAt).getTime();
      const endTime = startTime + testData.testDuration * 60 * 1000;
      return Math.max(endTime - Date.now(), 0);
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    // Update timer every second
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(timerInterval);
          setTimerExpired(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [testData]);

  useEffect(() => {
    if (timerExpired) {
      handleFinalAnswer();
      handleFinish();
    }
  });

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <div className="h-40 bg-white mt-4 rounded shadow" />
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="p-4">
        <p className="text-red-500">Failed to load test data.</p>
      </div>
    );
  }

  // Handler untuk perubahan answer (dari komponen QuestionCardStart)
  const handleAnswerChange = (updatedQuestion: Question) => {
    if (!testData) return;
    const newQuestions = testData.questions.map((q) =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setTestData({ ...testData, questions: newQuestions });
  };

  // Handler tombol Next
  const handleNext = async () => {
    const currentQuestion = testData.questions[currentIndex];
    await updateCurrentQuestion(currentQuestion);
    if (currentIndex < testData.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handler tombol Prev
  const handlePrev = async () => {
    const currentQuestion = testData.questions[currentIndex];
    await updateCurrentQuestion(currentQuestion);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handler ketika pilih soal melalui sheet
  const handleSelectQuestion = async (index: number) => {
    const currentQuestion = testData.questions[currentIndex];
    await updateCurrentQuestion(currentQuestion);
    setCurrentIndex(index);
    setSheetOpen(false);
  };

  // Handler tombol Mark: toggle properti isMarked
  const handleMarkQuestion = () => {
    if (!testData) return;
    const updatedQuestion = {
      ...testData.questions[currentIndex],
      isMarked: !testData.questions[currentIndex].isMarked,
    };
    const newQuestions = testData.questions.map((q) =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setTestData({ ...testData, questions: newQuestions });
  };

  const handleFinalAnswer = async () => {
    const currentQuestion = testData.questions[currentIndex];
    await updateCurrentQuestion(currentQuestion);
  };
  const handleFinish = async () => {
    router.push(`/test/${joinCode}/result`);
  };
  
  const currentQuestion = testData.questions[currentIndex];

  return (
    <>
      {/* Navbar */}
      <nav className="h-16 w-full flex justify-between items-center p-4 shadow-sm bg-white fixed top-0 left-0 z-10">
        <h1 className="text-2xl font-bold">{testData.participantUsername}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
            <span className="font-mono text-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </nav>

      {/* Konten utama */}
      <div className="w-full min-h-screen pt-16">
        <div className="w-full h-full flex flex-col gap-4 p-4">
          <p className="text-lg font-bold">{testData.testTitle}</p>
          <QuestionCardStart
            data={currentQuestion}
            onAnswerChange={handleAnswerChange}
            currentIndex={currentIndex}
          />
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 w-full p-4 flex justify-between items-center">
        <Button onClick={handlePrev} disabled={currentIndex === 0 || isLoading}>
          {isLoading ? "Loading..." : "Prev"}
        </Button>
        <div className="flex gap-2">
        <Button
          onClick={handleMarkQuestion}
          variant={currentQuestion.isMarked ? "secondary" : "default"}
        >
          {currentQuestion.isMarked ? "Unmark" : "Mark"}
        </Button>
        <Button onClick={() => setSheetOpen((prev) => !prev)}>
            {sheetOpen ? "Close List" : "View Questions"}
        </Button>
        </div>
        {currentIndex === testData.questions.length - 1 ? (
        <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogTrigger asChild>
            <Button
            onClick={async () => {
              setIsLoading(true); // Set loading state
              await handleFinalAnswer(); // Simpan jawaban terakhir
              setIsLoading(false); // Reset loading state
              setShowFinishDialog(true); // Baru buka dialog
            }}
            disabled={isLoading} // Disable button saat loading
            >
            {isLoading ? "Loading..." : "Finish"}
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to finish the test?</AlertDialogTitle>
            <AlertDialogDescription>
              Once you finish, you won&apos;t be able to change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowFinishDialog(false);
                handleFinish();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>      
        ) : (
        <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? "Loading..." : "Next"}
        </Button>
        )}
      </footer>

      <TestQuestionList
        questions={testData.questions}
        onSelectQuestion={handleSelectQuestion}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}