"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { getParticipantTestData } from "@/app/actions/participant/get-test-data";
import { completeParticipantTest } from "@/app/actions/participant/complete";
import {
  saveEssayAnswerText,
  gradeEssayAnswerAsync,
  updateChoiceAnswer,
  updateMultipleSelectAnswer,
} from "@/app/actions/answer";
import type {
  ParticipantTestData,
  QuestionWithAnswer,
} from "@/types/participant-test";

import NavbarTest from "./components/navbar-test";
import FooterTest from "./components/footer-test";
import Question from "./components/question";
import Answer from "./components/answer";
import QuestionList from "./components/question-list";
import { devLog } from "@/utils/devLog";

interface StartPageClientProps {
  participantId: string;
}

export default function StartPageClient({
  participantId,
}: StartPageClientProps) {
  const router = useRouter();
  const [data, setData] = useState<ParticipantTestData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState<QuestionWithAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarked, setIsMarked] = useState<boolean[]>([]);
  const [openQuestionList, setOpenQuestionList] = useState(false);

  // Track pending essay grading promises
  const pendingGradesRef = useRef<Promise<unknown>[]>([]);

  const isLastQuestion = data
    ? currentIndex === data.questions.length - 1
    : false;

  // Fetch participant test data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getParticipantTestData(participantId);
        if (result.success && result.data) {
          setData(result.data);
          setQuestion(result.data.questions[0]);
          setIsMarked(new Array(result.data.questions.length).fill(false));
        } else {
          toast.error(result.error || "Failed to load test data");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching participant data:", error);
        toast.error("Failed to load test data");
        router.push("/");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [participantId, router]);

  // Update answer on the server
  const updateAnswer = useCallback(
    async (q: QuestionWithAnswer) => {
      if (!data) return;

      setIsSaving(true);
      try {
        if (q.type === "ESSAY" && q.essay) {
          // Save essay text immediately (fast)
          const result = await saveEssayAnswerText({
            answerId: q.essay.answer.id,
            participantId: data.participant.id,
            answerText: q.essay.answer.answerText,
          });

          if (!result.success) {
            if (result.error === "Test is not accepting responses") {
              toast.error(result.error);
            }
            devLog("Essay save failed:", result.error);
            return;
          }

          // If subjective essay needs async grading, start it in background
          if (result.needsAsyncGrading) {
            const gradePromise = gradeEssayAnswerAsync({
              answerId: q.essay.answer.id,
              participantId: data.participant.id,
            });
            pendingGradesRef.current.push(gradePromise);
            devLog("Essay saved, grading started in background");
          } else {
            devLog("Essay saved and graded (exact match)");
          }
        } else if (q.type === "CHOICE" && q.choice) {
          if (!q.choice.answer.selectedChoiceId) {
            devLog("No choice selected, skipping update");
            return;
          }

          const result = await updateChoiceAnswer({
            answerId: q.choice.answer.id,
            participantId: data.participant.id,
            selectedChoiceId: q.choice.answer.selectedChoiceId,
          });

          if (!result.success) {
            if (result.error === "Test is not accepting responses") {
              toast.error(result.error);
            }
            devLog("Choice update failed:", result.error);
            return;
          }
          devLog("Choice updated successfully");
        } else if (q.type === "MULTIPLE_SELECT" && q.multipleSelect) {
          const selectedIds = q.multipleSelect.answer.selectedChoices.map(
            (c) => c.id
          );

          const result = await updateMultipleSelectAnswer({
            answerId: q.multipleSelect.answer.id,
            participantId: data.participant.id,
            selectedChoiceIds: selectedIds,
          });

          if (!result.success) {
            if (result.error === "Test is not accepting responses") {
              toast.error(result.error);
            }
            devLog("Multiple select update failed:", result.error);
            return;
          }
          devLog("Multiple select updated successfully");
        }
      } catch (error) {
        console.error("Error updating answer:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [data]
  );

  // Handle navigation between questions
  const handleNavigation = useCallback(
    async (newIndex: number) => {
      if (!data || !question) return;

      const originalQuestion = data.questions[currentIndex];
      const hasChanged =
        JSON.stringify(question) !== JSON.stringify(originalQuestion);

      if (hasChanged) {
        try {
          await updateAnswer(question);
          const updated = [...data.questions];
          updated[currentIndex] = question;
          setData({ ...data, questions: updated });
        } catch (error) {
          console.error("Failed to update answer before navigation", error);
        }
      }

      setCurrentIndex(newIndex);
      setQuestion(data.questions[newIndex]);
    },
    [data, question, currentIndex, updateAnswer]
  );

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) handleNavigation(currentIndex - 1);
  }, [currentIndex, handleNavigation]);

  const handleNext = useCallback(() => {
    if (data && currentIndex < data.questions.length - 1) {
      handleNavigation(currentIndex + 1);
    }
  }, [data, currentIndex, handleNavigation]);

  const handleMark = useCallback((index: number) => {
    setIsMarked((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  }, []);

  const handleFinish = useCallback(async () => {
    if (!data || !question) return;

    devLog("Finishing test...");
    const originalQuestion = data.questions[currentIndex];
    const hasChanged =
      JSON.stringify(question) !== JSON.stringify(originalQuestion);

    if (hasChanged) {
      try {
        await updateAnswer(question);
        const updated = [...data.questions];
        updated[currentIndex] = question;
        setData({ ...data, questions: updated });
      } catch (error) {
        console.error("Failed to update answer before finishing", error);
      }
    }
  }, [data, question, currentIndex, updateAnswer]);

  const endTest = useCallback(async () => {
    if (!data) return;

    setIsLoading(true);
    devLog("Ending test...");

    // Wait for all pending essay grades to complete
    if (pendingGradesRef.current.length > 0) {
      devLog(
        `Waiting for ${pendingGradesRef.current.length} pending essay grades...`
      );
      await Promise.all(pendingGradesRef.current);
      pendingGradesRef.current = [];
      devLog("All essay grades completed");
    }

    // Mark test as completed
    const result = await completeParticipantTest(data.participant.id);
    if (!result.success) {
      toast.error(result.error || "Failed to complete test");
      setIsLoading(false);
      return;
    }

    router.push(`/test/result/${data.participant.id}`);
    devLog("Redirecting to result page...");
  }, [data, router]);

  // Loading skeleton
  if (isLoading || !data || !question) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col">
        <main className="my-16 p-4 grow flex flex-col justify-start items-center gap-6">
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

          {/* Question List Toggle */}
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
  }

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <NavbarTest
        participant={data.participant}
        test={data.test}
        handleFinish={handleFinish}
        endTest={endTest}
      />
      <main className="my-16 p-4 grow flex flex-col justify-start items-center gap-6">
        <div className="flex items-center justify-start w-full">
          <Label className="text-2xl font-semibold">{data.test.title}</Label>
        </div>
        {data.questions.length > currentIndex && (
          <div className="w-full md:max-w-2xl flex flex-col justify-start gap-4 min-h-screen">
            <Question question={question} index={currentIndex + 1} />
            <Answer question={question} setQuestion={setQuestion} />
          </div>
        )}
        <QuestionList
          questions={data.questions}
          question={question}
          handleNavigation={handleNavigation}
          isMarked={isMarked}
          open={openQuestionList}
          setOpen={setOpenQuestionList}
        />
      </main>
      <FooterTest
        handlePrev={handlePrev}
        handleMark={() => handleMark(currentIndex)}
        isCurrentMarked={isMarked[currentIndex]}
        handleNext={handleNext}
        handlelist={() => setOpenQuestionList((prev) => !prev)}
        isLastQuestion={isLastQuestion}
        isLoading={isSaving}
        handleFinish={handleFinish}
        handleEndTest={endTest}
      />
    </div>
  );
}
