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
import { devLog } from "@/utils/devLog";

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
        devLog("data:", data);
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
          credentials: "include",
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

        devLog("Essay Update");
        devLog("Essay Finish Update");
      } else if (type === "CHOICE") {
        devLog("Choice Update");
        const answer = question.choice?.answer;
        if (!answer) return;
        const res = await fetch("/api/v1/answer/choice", {
          method: "PATCH",
          credentials: "include",
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

        devLog("Choice Update Successful :", res);
        devLog("Choice Finish Update");
      } else if (type === "MULTIPLE_SELECT") {
        devLog("Multiple Select Update");
        const answers = question.multipleSelect?.answer.selectedChoices || [];
        if (!answers) return;
        const res = await fetch("/api/v1/answer/multiple-select", {
          method: "PATCH",
          credentials: "include",
          body: JSON.stringify({
            answerId: question.multipleSelect?.answer.id,
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

        devLog("Multiple Select Finish Update");
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
    devLog("Finishing test...");
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
    devLog("Ending test...");
    // Tambahkan logika kirim ke backend, simpan waktu selesai, dll.
    // Redirect jika perlu
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push(`/test/result/${participant?.id}`);
    removeParticipantId();
    devLog("Redirecting to finish page...");
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
