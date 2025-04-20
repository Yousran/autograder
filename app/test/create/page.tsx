// file: app/test/create/page.tsx
"use client";

import { z } from "zod";
import { useState } from "react";
import Navbar from "@/components/custom/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionsBuilder } from "./components/questions-builder";
import { TestSettings } from "./components/test-settings";
import { Question } from "@/types/question";

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

const defaultQuestion: Question = {
  id: crypto.randomUUID(),
  testId: "",
  type: "ESSAY",
  questionText: "",
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function TestCreatePage() {
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

  const [questions, setQuestions] = useState<Question[]>([defaultQuestion]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const result = testSchema.safeParse(test);

    if (!result.success) {
      const firstError = Object.values(result.error.flatten().fieldErrors)[0];
      setError(Array.isArray(firstError) ? firstError[0] : "Invalid input");
      return;
    }

    setError(null);
    console.log("✅ Valid test data", result.data);
    console.log("📝 Questions", questions);
    // TODO: handle API call here
  };

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
                {error && (
                  <p className="text-sm text-red-500 mt-1 font-medium">
                    {error}
                  </p>
                )}
                <Button onClick={handleSubmit} className="w-full">
                  Create Test
                </Button>
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
