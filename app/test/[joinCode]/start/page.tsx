<<<<<<< HEAD
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
=======
// file: app/test/[joinCode]/start/page.tsx

"use client";

import { Label } from "@/components/ui/label";
import FooterTest from "./components/footer-test";
import NavbarTest from "./components/navbar-test";
import Question from "./components/question";
import Answer from "./components/answer";
import { useEffect, useState } from "react";
import { getParticipantId, removeParticipantId } from "@/lib/auth-client";
import { Participant, QuestionWithAnswers, Test } from "./participant-response";
import QuestionList from "./components/question-list";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function StartPage() {
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState<QuestionWithAnswers>(
    questions[currentIndex]
  );
  const isLastQuestion = currentIndex === questions.length - 1;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isMarked, setIsMarked] = useState<boolean[]>([]);
  const [openQuestionList, setOpenQuestionList] = useState(false);

  useEffect(() => {
    fetchParticipant();
  }, []);

  const fetchParticipant = async () => {
    setIsLoading(true);
    try {
      const id = getParticipantId();

      if (id) {
        const response = await fetch(`/api/v1/participant/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        console.log("data:", data);
        setTest(data.test);
        setParticipant(data.participant);
        setQuestions(data.questions);
        setQuestion(data.questions[0]);
        setIsMarked(new Array(data.questions.length).fill(false));
      }
    } catch (error) {
      console.error("Error fetching participant:", error);
    }
    setIsLoading(false);
  };

  const updateAnswer = async (question: QuestionWithAnswers) => {
    setIsFetchLoading(true);
    const type = question.type;

    try {
      if (type === "ESSAY") {
        const answer = question.essay?.answer;
        if (!answer) return;
        const res = await fetch("/api/v1/answer/essay", {
          method: "PATCH",
          body: JSON.stringify({
            answerId: answer.id,
            participantId: participant?.id,
            answerText: answer.answerText,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.status === 403) {
          const errorData = await res.json();
          if (errorData.error === "Test is not accepting responses") {
            toast.error(errorData.error);
          }
          return;
        }

        console.log("Essay Update");
        console.log("Essay Finish Update");
      } else if (type === "CHOICE") {
        console.log("Choice Update");
        const answer = question.choice?.answer;
        if (!answer) return;
        const res = await fetch("/api/v1/answer/choice", {
          method: "PATCH",
          body: JSON.stringify({
            answerId: answer.id,
            participantId: participant?.id,
            selectedChoiceId: answer.selectedChoiceId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.status === 403) {
          const errorData = await res.json();
          if (errorData.error === "Test is not accepting responses") {
            toast.error(errorData.error);
          }
          return;
        }

        console.log("Choice Update Successful :", res);
        console.log("Choice Finish Update");
      } else if (type === "MULTIPLE_CHOICE") {
        console.log("Multiple Choice Update");
        const answers = question.multipleChoice?.answer.selectedChoices || [];
        if (!answers) return;
        const res = await fetch("/api/v1/answer/multiple-choice", {
          method: "PATCH",
          body: JSON.stringify({
            answerId: question.multipleChoice?.answer.id,
            answers: answers,
            participantId: participant?.id,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.status === 403) {
          const errorData = await res.json();
          if (errorData.error === "Test is not accepting responses") {
            toast.error(errorData.error);
          }
          return;
        }

        console.log("Multiple Choice Finish Update");
      }
    } catch (error) {
      console.error("Error updating answer:", error);
    } finally {
      setIsFetchLoading(false);
    }
  };

  const handleNavigation = async (newIndex: number) => {
    const originalQuestion = questions[currentIndex];
    const hasChanged =
      JSON.stringify(question) !== JSON.stringify(originalQuestion);

    if (hasChanged) {
      try {
        updateAnswer(question);
        const updated = [...questions];
        updated[currentIndex] = question;
        setQuestions(updated);
      } catch (error) {
        console.error("Failed to update answer before navigation", error);
      }
    }
    setCurrentIndex(newIndex);
    setQuestion(questions[newIndex]);
  };

  const handlePrev = () => {
    if (currentIndex > 0) handleNavigation(currentIndex - 1);
  };

  const handleMark = (index: number) => {
    setIsMarked((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) handleNavigation(currentIndex + 1);
  };

  const handleFinish = async () => {
    console.log("Finishing test...");
    const originalQuestion = questions[currentIndex];
    const hasChanged =
      JSON.stringify(question) !== JSON.stringify(originalQuestion);

    if (hasChanged) {
      try {
        updateAnswer(question);
        const updated = [...questions];
        updated[currentIndex] = question;
        setQuestions(updated);
      } catch (error) {
        console.error("Failed to update answer before navigation", error);
      }
    }
  };

  const endTest = async () => {
    setIsLoading(true);
    console.log("Ending test...");
    // Tambahkan logika kirim ke backend, simpan waktu selesai, dll.
    // Redirect jika perlu
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push(`/test/result/${participant?.id}`);
    removeParticipantId();
    console.log("Redirecting to finish page...");
    setIsLoading(false);
  };
  if (isLoading) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col">
        <main className="my-16 p-4 flex-grow flex flex-col justify-start items-center gap-6">
          {/* Title */}
          <div className="flex items-center justify-start w-full">
            <Skeleton className="h-8 w-1/2 rounded-md" />
          </div>

          {/* Question & Answer */}
          <div className="w-full md:max-w-2xl flex flex-col justify-start gap-4 min-h-screen">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-10 w-1/2 mt-4" />
          </div>

          {/* Question List Toggle / Sheet */}
          <div className="w-full flex justify-end">
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </main>

        {/* Footer */}
        <div className="w-full px-4 py-6 border-t flex justify-between items-center">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    );
  } else {
    return (
      <div className="max-w-screen min-h-screen flex flex-col">
        <NavbarTest
          participant={participant}
          test={test}
          handleFinish={handleFinish}
          endTest={endTest}
        />
        <main className="my-16 p-4 flex-grow flex flex-col justify-start items-center gap-6">
          <div className="flex items-center justify-start w-full">
            <Label className="text-2xl font-semibold">{test?.title}</Label>
          </div>
          {questions.length > currentIndex && (
            <div className="w-full md:max-w-2xl flex flex-col justify-start gap-4 min-h-screen">
              <Question question={question} index={currentIndex + 1} />
              <Answer question={question} setQuestion={setQuestion} />
            </div>
          )}
          <QuestionList
            questions={questions}
            question={question}
            handleNavigation={handleNavigation}
            isMarked={isMarked}
            open={openQuestionList}
            setOpen={setOpenQuestionList}
          />
        </main>
        <FooterTest
          handlePrev={handlePrev}
          handleMark={handleMark.bind(null, currentIndex)}
          isCurrentMarked={isMarked[currentIndex]}
          handleNext={handleNext}
          handlelist={() => setOpenQuestionList((prev) => !prev)}
          isLastQuestion={isLastQuestion}
          isLoading={isFetchLoading}
          handleFinish={handleFinish}
          handleEndTest={endTest}
        />
      </div>
    );
  }
}
>>>>>>> baru/main
