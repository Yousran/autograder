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
  //TODO: akan digunakan saat melakukan fetch agar tombol akhiri test tidak bisa di klik
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
      }
    } catch (error) {
      console.error("Error fetching participant:", error);
    }
  };

  const handleNavigation = async (newIndex: number) => {
    setIsLoading(true);
    setCurrentIndex(newIndex);
    setIsLoading(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) handleNavigation(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) handleNavigation(currentIndex + 1);
  };

  const handleMark = () => {
    console.log("Mark button clicked");
  };

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <NavbarTest participant={participant} test={test} />
      <main className="my-16 p-4 flex-grow flex flex-col justify-start items-center gap-6">
        <div className="flex items-center justify-start w-full">
          <Label className="text-2xl font-semibold">{test?.title}</Label>
          <Label className="text-2xl font-semibold">
            {isLoading ? "loading" : "selesai"}
          </Label>
        </div>
        {questions.length > currentIndex && (
          <div className="w-full md:max-w-2xl flex flex-col justify-start gap-4 min-h-screen">
            <Question question={questions[currentIndex]} />
            <Answer question={questions[currentIndex]} />
          </div>
        )}
      </main>
      <FooterTest
        handlePrev={handlePrev}
        handleMark={handleMark}
        handleNext={handleNext}
      />
    </div>
  );
}
