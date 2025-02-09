//app/show-created-test/[joinCode]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuestionCard } from "@/components/custom/question-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Definisi tipe data sesuai dengan skema Prisma
type Choice = {
  id: number;
  choice_text: string;
  is_right: boolean;
};

type ChoiceQuestion = {
  id: number;
  question: string;
  Choices: Choice[];
};

type EssayQuestion = {
  id: number;
  question: string;
  answer_key: string;
};

type TestData = {
  id: number;
  test_title: string;
  join_code: string;
  accept_responses: boolean;
  show_detailed_score: boolean;
  is_ordered: boolean;
  EssayQuestions: EssayQuestion[];
  ChoiceQuestions: ChoiceQuestion[];
};

export default function ShowCreatedTestPage() {
  const { joinCode } = useParams<{ joinCode: string }>();

  // Inisialisasi state terlebih dahulu sebelum return apapun
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    accept_responses: false,
    show_detailed_score: false,
    is_ordered: false,
  });

  useEffect(() => {
    if (joinCode) {
      fetch(`/api/v1/show-created-test/${joinCode}`)
        .then((res) => res.json())
        .then((data: { test: TestData }) => {
          if (data.test) {
            setTestData(data.test);
            setSettings({
              accept_responses: data.test.accept_responses,
              show_detailed_score: data.test.show_detailed_score,
              is_ordered: data.test.is_ordered,
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching test:", err);
          setLoading(false);
        });
    }
  }, [joinCode]);

  if (loading) return <p>Loading...</p>;
  if (!testData) return <p>Test not found.</p>;

  const combinedQuestions = [
    ...testData.ChoiceQuestions.map((q) => ({
      id: `choice-${q.id}`,
      text: q.question,
      type: "multipleChoice" as const,
      choices: q.Choices,
    })),
    ...testData.EssayQuestions.map((q) => ({
        id: `essay-${q.id}`,
        text: q.question,
        type: "essay" as const,
        answerKey: q.answer_key,
      })),
  ];

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    try {
      const res = await fetch(`/api/v1/show-created-test/${joinCode}/setting`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) throw new Error("Failed to update setting");

      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error("Error updating setting:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-center items-center gap-4 p-4">
        <Card className="w-full sm:w-2/5 p-4 flex flex-col">
          <p className="text-xl font-semibold">{testData.test_title}</p>
          <div className="flex gap-2">
            <p className="text-lg w-full">{testData.join_code}</p>
            <Button><i className="bx bx-qr text-lg"></i></Button>
          </div>
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
            <div className="flex flex-col gap-4">
              {combinedQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="responses">
            <p className="p-4 text-gray-600">Responses content will be displayed here.</p>
          </TabsContent>
          <TabsContent value="settings">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="accept_responses">Accept Responses</Label>
                <Switch
                  id="accept_responses"
                  checked={settings.accept_responses}
                  onCheckedChange={(value) => handleSettingChange("accept_responses", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show_detailed_score">Show Detailed Score</Label>
                <Switch
                  id="show_detailed_score"
                  checked={settings.show_detailed_score}
                  onCheckedChange={(value) => handleSettingChange("show_detailed_score", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_ordered">Is Ordered</Label>
                <Switch
                  id="is_ordered"
                  checked={settings.is_ordered}
                  onCheckedChange={(value) => handleSettingChange("is_ordered", value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
