<<<<<<< HEAD
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
=======
// file: app/test/create/page.tsx
"use client";
//TODO: setelah menambahkan choice dan multiple choice, lalu beralih ke tab settings, choice dan multiple choice menghilang

import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionsBuilder } from "./components/questions-builder";
import { TestSettings } from "./components/test-settings";
import { EssayQuestion, Question } from "@/types/question";
import { toast } from "sonner";
import { getToken } from "@/lib/auth-client";
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

// Schema Zod
export const testSchema = z.object({
  title: z.string().min(3, { message: "Title is required" }),
  description: z.string().optional(),
  testDuration: z
    .number({ invalid_type_error: "Duration must be a number" })
    .min(1, { message: "Minimum 1 minute" }),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  acceptResponses: z.boolean(),
  showDetailedScore: z.boolean(),
  showCorrectAnswers: z.boolean(),
  isOrdered: z.boolean(),
});

export type TestFormValues = z.infer<typeof testSchema>;

export const defaultQuestion: EssayQuestion = {
  id: crypto.randomUUID(),
  testId: "",
  type: "ESSAY",
  questionText: "",
  answerText: "",
  order: 1,
  isExactAnswer: false,
  maxScore: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function TestCreatePage() {
  const router = useRouter();
  const [test, setTest] = useState<TestFormValues>({
    title: "",
    testDuration: 30,
    description: "",
    startTime: undefined,
    endTime: undefined,
    acceptResponses: true,
    showDetailedScore: false,
    showCorrectAnswers: false,
    isOrdered: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([defaultQuestion]);

  async function handleSubmit() {
    setIsLoading(true);
    const validation = testSchema.safeParse(test);

    if (!validation.success) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const res = await fetch("/api/v1/test/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        ...validation.data,
        questions,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Gagal submit:", err.message);
      toast.error("Failed to create test.");
      setIsLoading(false);
      return;
    }

    const result = await res.json();
    toast.success("Test created!");
    console.log("Created test:", result.test);
    router.push("/test/" + result.joinCode + "/edit");
    setIsLoading(false);
  }

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex justify-center items-start p-4">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-center">
                Create Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="title" className="font-medium">
                    Test Title
                  </label>
                  <Input
                    id="title"
                    value={test.title}
                    onChange={(e) =>
                      setTest({ ...test, title: e.target.value })
                    }
                    placeholder="Enter test title"
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={isLoading}>
                      Create Test
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Create Test</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to create the test? You wont be
                        able to change your questions afterwards.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSubmit}
                        disabled={isLoading}
                      >
                        {isLoading ? "Loading..." : "Create Test"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="questions">
              <QuestionsBuilder
                questions={questions}
                setQuestions={setQuestions}
              />
            </TabsContent>

            <TabsContent value="settings">
              <TestSettings test={test} setTest={setTest} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
>>>>>>> baru/main
