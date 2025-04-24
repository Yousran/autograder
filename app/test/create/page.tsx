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
import { defaultQuestion, Question } from "@/types/question";
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
const testSchema = z.object({
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
