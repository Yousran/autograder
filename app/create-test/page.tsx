// app/create-test/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateQuestion } from "@/components/custom/create-question";
import Navbar from "@/components/custom/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
export default function CreateTestPage() {
  const router = useRouter();
  const [testTitle, setTestTitle] = useState("");
  const [testDuration, setTestDuration] = useState<number>(0);
  const [acceptResponses, setAcceptResponses] = useState(false);
  const [showDetailedScore, setShowDetailedScore] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);

  // State untuk daftar soal
  const [questions, setQuestions] = useState<
    {
      id: number;
      text: string;
      type: "essay" | "multipleChoice";
      choices: string[];
      correctChoiceIndex: number | null;
      answerKey: string;
    }[]
  >([
    {
      id: 0,
      text: "",
      type: "multipleChoice",
      choices: [""],
      correctChoiceIndex: null,
      answerKey: "",
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length,
        text: "",
        type: "multipleChoice",
        choices: [""],
        correctChoiceIndex: null,
        answerKey: "",
      },
    ]);
  };

  const updateQuestion = (
    index: number,
    newData: Partial<{
      id: number;
      text: string;
      type: "essay" | "multipleChoice";
      choices: string[];
      correctChoiceIndex: number | null;
      answerKey: string;
    }>
  ) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...newData } : q)));
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Fungsi untuk mengirim data test beserta soal ke API
  const createTest = async () => {
    try {
      const payload = {
        test_title: testTitle,
        test_duration: testDuration,
        accept_responses: acceptResponses,
        show_detailed_score: showDetailedScore,
        is_ordered: isOrdered,
        questions,
      };
      
      const token = localStorage.getItem("token");
      const res = await fetch("/api/v1/create-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/show-created-test/${data.join_code}`);
        // Lakukan redirect atau reset form sesuai kebutuhan
      } else {
        const error = await res.json();
        alert("Error: " + error.error);
      }
    } catch (err) {
      console.error("Error creating test:", err);
      alert("Terjadi kesalahan internal.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-center items-center gap-4 p-4">
        <Card className="w-full sm:w-2/5 p-4">
          <Input
            placeholder="Test Title"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Test Duration (menit)"
            value={testDuration}
            onChange={(e) => setTestDuration(Number(e.target.value))}
            className="mt-2"
          />
          <Button className="w-full mt-4" onClick={createTest}>
            Create Test
          </Button>
        </Card>

        <Tabs defaultValue="question" className="w-full sm:w-2/5">
          <TabsList className="w-full flex">
            <TabsTrigger value="question" className="flex-1">
              Question
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex-1">
              Responses
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="question">
            <CreateQuestion
              questions={questions}
              addQuestion={addQuestion}
              updateQuestion={updateQuestion}
              removeQuestion={removeQuestion}
            />
          </TabsContent>

          <TabsContent value="responses">
            <p className="p-4 text-gray-600">
              Responses content will be displayed here.
            </p>
          </TabsContent>

          <TabsContent value="settings">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="accept_responses">Accept Responses</Label>
                <Switch
                  id="accept_responses"
                  checked={acceptResponses}
                  onCheckedChange={setAcceptResponses}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show_detailed_score">Show Detailed Score</Label>
                <Switch
                  id="show_detailed_score"
                  checked={showDetailedScore}
                  onCheckedChange={setShowDetailedScore}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_ordered">Ordered</Label>
                <Switch
                  id="is_ordered"
                  checked={isOrdered}
                  onCheckedChange={setIsOrdered}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
