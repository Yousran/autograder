// file: app/test/[joinCode]/start/page.tsx

"use client";

import { Label } from "@/components/ui/label";
import FooterTest from "./components/footer-test";
import NavbarTest from "./components/navbar-test";
import Question from "./components/question";
import Answer from "./components/answer";
import { useEffect, useState } from "react";
import { getParticipantId } from "@/lib/auth-client";
import { Participant, QuestionWithAnswers, Test } from "./participant-response";
import QuestionList from "./components/question-list";

export default function StartPage() {
  const [test, setTest] = useState<Test | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState<QuestionWithAnswers>(
    questions[currentIndex]
  );
  const isLastQuestion = currentIndex === questions.length - 1;
  const [isLoading, setIsLoading] = useState(false);
  const [isMarked, setIsMarked] = useState<boolean[]>([]);
  const [openQuestionList, setOpenQuestionList] = useState(false);

  useEffect(() => {
    fetchParticipant();
  }, []);

  const fetchParticipant = async () => {
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
  };

  const updateAnswer = async (question: QuestionWithAnswers) => {
    setIsLoading(true);
    const type = question.type;

    if (type === "ESSAY") {
      const answer = question.essay?.answer;
      if (!answer) return;
      await fetch("/api/v1/answer/essay", {
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
      console.log("Essay Update");
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Essay Finish Update");
    } else if (type === "CHOICE") {
      try {
        console.log("Choice Update");
        const answer = question.choice?.answer;
        console.log("answer: ", answer);
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
        console.log("Choice Update Successful :", res);
      } catch (error) {
        console.error("Error updating choice answer:", error);
      }
      // await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Choice Finish Update");
    } else if (type === "MULTIPLE_CHOICE") {
      console.log("Multiple Choice Update");
      const answers = question.multipleChoice?.answer.selectedChoices || [];
      if (!answers) return;
      console.log("answers: ", answers);
      await fetch("/api/v1/answer/multiple-choice", {
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
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Multiple Choice Finish Update");
    }
    setIsLoading(false);
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
    console.log("Ending test...");
    // Tambahkan logika kirim ke backend, simpan waktu selesai, dll.
    // Redirect jika perlu
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Redirecting to finish page...");
  };

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
        isLoading={isLoading}
        handleFinish={handleFinish}
        handleEndTest={endTest}
      />
    </div>
  );
}
