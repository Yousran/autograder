// file: app/test/[joinCode]/start/page.tsx

//TODO: update text when answer is changed and user clicking navigation button
"use client";

import { Label } from "@/components/ui/label";
import FooterTest from "./components/footer-test";
import NavbarTest from "./components/navbar-test";
import Question from "./components/question";
import Answer from "./components/answer";
import { useEffect, useState } from "react";
import { getParticipantId } from "@/lib/auth-client";
import { Participant, QuestionWithAnswers, Test } from "./participant-response";

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
      }
    } catch (error) {
      console.error("Error fetching participant:", error);
    }
  };

  const updateAnswer = async (question: QuestionWithAnswers) => {
    setIsLoading(true);
    const type = question.type;

    if (type === "ESSAY") {
      // const answer = question.essay?.answer;
      // if (!answer) return;
      // await fetch("/api/v1/answer/essay/update", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     id: answer.id,
      //     answerText: answer.answerText,
      //   }),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      console.log("Essay Update");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Essay Finish Update");
    } else if (type === "CHOICE") {
      // const answer = question.choice?.answer;
      // if (!answer) return;
      // await fetch("/api/v1/answer/choice/update", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     id: answer.id,
      //     selectedChoiceId: answer.selectedChoiceId,
      //   }),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });

      console.log("Choice Update");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Choice Finish Update");
    } else if (type === "MULTIPLE_CHOICE") {
      // const answers = question.multipleChoice?.answers || [];
      // await fetch("/api/v1/answer/multiple-choice/update", {
      //   method: "POST",
      //   body: JSON.stringify(
      //     answers.map((a) => ({
      //       id: a.id,
      //       selectedChoiceId: a.selectedChoiceId,
      //     }))
      //   ),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      console.log("Multiple Choice Update");
      await new Promise((resolve) => setTimeout(resolve, 2000));
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

  const handleMark = () => {
    console.log("Question with Answer : ", question);
    console.log("Mark button clicked");
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
          <Label className="text-2xl font-semibold">
            {isLoading ? "loading" : "selesai"}
          </Label>
        </div>
        {questions.length > currentIndex && (
          <div className="w-full md:max-w-2xl flex flex-col justify-start gap-4 min-h-screen">
            <Question question={question} index={currentIndex + 1} />
            <Answer question={question} setQuestion={setQuestion} />
          </div>
        )}
      </main>
      <FooterTest
        handlePrev={handlePrev}
        handleMark={handleMark}
        handleNext={handleNext}
        isLastQuestion={isLastQuestion}
        isLoading={isLoading}
        handleFinish={handleFinish}
        handleEndTest={endTest}
      />
    </div>
  );
}
