// app/test/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Navbar from "@/components/custom/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import QuestionCardCreate from "@/components/custom/question-card-create";
import { Question } from "@/types";

export default function CreateTest() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [nextId, setNextId] = useState(1);
  const [testTitle, setTestTitle] = useState("");
  const [testDuration, setTestDuration] = useState("");
  const [acceptResponses, setAcceptResponses] = useState(true);
  // const [showDetailedScore, setShowDetailedScore] = useState(false);
  const [isOrdered, setIsOrdered] = useState(true);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: nextId,
      type: "essay",
      question: "",
      answerKey: "",
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setNextId((prev) => prev + 1);
  };

  const handleQuestionChange = (updatedQuestion: Question) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCreateTest = async () => {
    const payload = {
      testTitle,
      testDuration: parseInt(testDuration),
      acceptResponses,
      //TODO: Show Detailed Score
      showDetailedScore: false,
      isOrdered,
      questions,
    };

    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/test/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Test berhasil dibuat", {
          description: "Silakan mulai undang peserta!",
        });
        router.push(`/test/${data.test.joinCode}/edit`);
      } else {
        toast.error("Gagal membuat test", {
          description: data.message || "Terjadi kesalahan.",
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      toast.error("Kesalahan jaringan", {
        description: "Tidak dapat terhubung ke server.",
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-start min-h-screen pt-16">
        <div className="w-full max-w-2xl flex flex-col justify-center gap-6 p-4">
          {/* Test Configuration */}
          <Card className="w-full shadow-lg rounded-2xl">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="test-title">Test Title</Label>
                <Input
                  id="test-title"
                  placeholder="Enter test title"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="test-duration">Test Duration (minutes)</Label>
                <Input
                  id="test-duration"
                  type="number"
                  placeholder="Enter test duration"
                  value={testDuration}
                  onChange={(e) => setTestDuration(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="accept-responses">Accept Responses</Label>
                <Switch
                  id="accept-responses"
                  checked={acceptResponses}
                  onCheckedChange={setAcceptResponses}
                />
              </div>
              {/* TODO: Show Detailed Score */}
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="show-detailed-score">Show Detailed Score</Label>
                <Switch
                  id="show-detailed-score"
                  checked={showDetailedScore}
                  onCheckedChange={setShowDetailedScore}
                />
              </div> */}
              <div className="flex items-center justify-between">
                <Label htmlFor="is-ordered">Is Ordered</Label>
                <Switch
                  id="is-ordered"
                  checked={isOrdered}
                  onCheckedChange={setIsOrdered}
                />
              </div>
                <Button
                variant="default"
                className="w-full"
                onClick={handleCreateTest}
                disabled={isLoading}
                >
                {isLoading ? "Creating..." : "Create Test"}
                </Button>
            </CardContent>
          </Card>

          {/* List of Questions */}
          <div className="w-full flex flex-col gap-6">
            {questions.map((question) => (
              <QuestionCardCreate
                key={question.id}
                question={question}
                onUpdate={handleQuestionChange}
                onDelete={() => handleDeleteQuestion(question.id)}
              />
            ))}
          </div>

          <Button className="w-full" onClick={handleAddQuestion}>
            Add Question
          </Button>
        </div>
      </div>
    </>
  );
}