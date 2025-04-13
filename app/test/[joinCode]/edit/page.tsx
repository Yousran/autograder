// app/test/[joinCode]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";

import Navbar from "@/components/custom/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Question } from "@/types";
import QuestionCard from "@/components/custom/question-card";

interface Participant {
  id: number;
  username: string | null;
  totalScore: number | null;
  createdAt: string;
  test: {
    joinCode: string;
    testTitle: string;
  };
  user: {
    id: number;
    username: string | null;
    email: string;
  } | null;
  _count: {
    essayAnswers: number;
    choiceAnswers: number;
  };
}

export default function EditTest() {
  const { joinCode } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participantLoading, setParticipantLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [updating, setUpdating] = useState({
    acceptResponses: false,
    showDetailedScore: false,
    isOrdered: false,
  });

  const [testData, setTestData] = useState<{
    testTitle: string;
    testDuration: number;
    joinCode: string;
    acceptResponses: boolean;
    showDetailedScore: boolean;
    isOrdered: boolean;
    questions: Question[];
  } | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      const token = Cookies.get("token");

      const res = await fetch(`/api/v1/test/show?joinCode=${joinCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        if (!data.questions) {
          // TODO: edit tidak bisa diakses jika bukan creator
          router.push("/");
        }
        setTestData(data);
      } else {
        toast.error("Gagal mengambil data test", { description: data.message });
      }
      setLoading(false);
    };

    fetchTest();
  }, [joinCode, router]);

  const fetchParticipants = async () => {
    try {
      const token = Cookies.get("token");
      const res = await fetch("/api/v1/participants", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
      } else {
        toast.error("Gagal mengambil data peserta", { description: data.message });
      }
    } catch (err) {
      console.error("Error fetching participants:", err);
    } finally {
      setParticipantLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateField = async (
    field: "acceptResponses" | "showDetailedScore" | "isOrdered",
    value: boolean
  ) => {
    if (!testData) return;
    setUpdating((prev) => ({ ...prev, [field]: true }));

    const token = Cookies.get("token");

    const res = await fetch("/api/v1/test/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ joinCode, [field]: value }),
    });

    const data = await res.json();
    if (res.ok) {
      setTestData((prev) => (prev ? { ...prev, [field]: value } : prev));
      toast.success("Berhasil diperbarui", { description: `Field ${field} diubah.` });
    } else {
      toast.error("Gagal update", { description: data.message });
    }

    setUpdating((prev) => ({ ...prev, [field]: false }));
  };

  if (loading || !testData) {
    return (
      <div className="p-6">
        <Navbar />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-start min-h-screen pt-16">
        <div className="w-full max-w-2xl flex flex-col justify-center p-4 gap-6">
          <Card className="w-full shadow-lg rounded-2xl">
            <CardContent className="flex flex-col gap-4 px-4">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{testData.testTitle}</h2>
                  <p className="text-sm text-gray-500">
                    Durasi: {testData.testDuration} menit
                  </p>
                  <p className="text-sm text-gray-500">Join Code: {testData.joinCode}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="accept-responses">Accept Responses</Label>
                <Switch
                  id="accept-responses"
                  checked={testData.acceptResponses}
                  onCheckedChange={(val) => updateField("acceptResponses", val)}
                  disabled={updating.acceptResponses}
                />
              </div>
              {/* // TODO: Show Detailed Score
              <div className="flex items-center justify-between">
                <Label htmlFor="show-detailed-score">Show Detailed Score</Label>
                <Switch
                  id="show-detailed-score"
                  checked={testData.showDetailedScore}
                  onCheckedChange={(val) => updateField("showDetailedScore", val)}
                  disabled={updating.showDetailedScore}
                />
              </div> */}
              <div className="flex items-center justify-between">
                <Label htmlFor="is-ordered">Is Ordered</Label>
                <Switch
                  id="is-ordered"
                  checked={testData.isOrdered}
                  onCheckedChange={(val) => updateField("isOrdered", val)}
                  disabled={updating.isOrdered}
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="flex flex-col gap-4">
              {testData.questions?.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </TabsContent>

            <TabsContent value="responses" className="w-full flex flex-col gap-4">
              {participantLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              ) : participants.length === 0 ? (
                <p className="text-muted-foreground">No Responses</p>
              ) : (
                participants
                  .filter((p) => p.test.joinCode === joinCode)
                  .map((p) => (
                    <Card key={p.id}>
                      <CardContent className="flex justify-between items-center gap-4 px-4 py-4">
                        <div>
                          <p className="font-semibold">
                            {p.username || p.user?.username || "Guest"}
                          </p>
                          <p className="text-sm text-gray-500">{p.user?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{p.totalScore ?? "-"}</p>
                          <p className="text-sm text-gray-500">
                            {p._count.essayAnswers + p._count.choiceAnswers} answers
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}