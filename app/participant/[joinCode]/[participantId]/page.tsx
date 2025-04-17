"use client";

import Navbar from "@/components/custom/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ParticipantResponse {
  participant: {
    id: number;
    username: string | null;
    user: {
      email: string;
    } | null;
    totalScore: number | null;
    test: {
      testTitle: string;
      questions: {
        id: number;
        essay: {
          questionText: string;
          answers: {
            id: number;
            participantId: number;
            answerText: string;
            score: number | null;
          }[];
        } | null;
        choice: {
          questionText: string;
          choices: {
            id: number;
            choiceText: string;
            isCorrect: boolean;
          }[];
          answers: {
            participantId: number;
            selectedChoiceId: number | null;
            score: number | null;
            choice?: {
              choiceText: string;
            };
          }[];
        } | null;
      }[];
    };
  };
}

export default function ParticipantPage() {
  const { participantId } = useParams();
  const [participantData, setParticipantData] = useState<ParticipantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchParticipantData = async () => {
      try {
        const res = await fetch("/api/v1/participant/show/creator", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ participantId: Number(participantId) }),
        });

        const data = await res.json();
        if (res.ok) {
          setParticipantData(data);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchParticipantData();
      setTotalScore(participantData?.participant.totalScore ?? null);
    }
  }, [participantData?.participant.totalScore, participantId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <Skeleton className="w-[400px] h-[200px]" />
        </div>
      </>
    );
  }

  const participant = participantData?.participant;

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-start min-h-screen pt-16">
        <div className="w-full max-w-2xl flex flex-col justify-center p-4 gap-6">
          {/* Participant Info */}
          <Card className="w-full shadow-lg rounded-2xl">
            <CardContent className="flex flex-col gap-4 px-4">
                <div className="flex justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">{participant?.username || "-"}</h2>
                        <p className="text-sm text-gray-500">
                            Email: {participant?.user?.email || "-"}
                        </p>
                    </div>
                    <h2 className="text-4xl font-bold">
                        {totalScore !== null ? totalScore.toFixed(2) : "-"}
                    </h2>
                </div>
            </CardContent>
          </Card>

          {/* Questions and Answers */}
          <div className="w-full flex flex-col gap-4">
        {participant?.test.questions.map((question, index) => {
            const isEssay = question.essay !== null;

            return (
            <Card key={question.id} className="w-full shadow-lg rounded-2xl">
                <CardContent className="flex flex-col gap-4 p-4">
                {isEssay ? (
                    <div className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>{`Question ${index + 1}`}</Label>
                        <Label>{question.essay?.questionText ?? "-"}</Label>
                    </div>
                    {question.essay?.answers?.map((ans, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                        <Label>Answer</Label>
                        <Label>{ans.answerText ?? "-"}</Label>
                        <Label>Score</Label>
                        <Select value={ans.score?.toString()} onValueChange={async (newScore) => {
                            const score = Number(newScore);
                            if (score === ans.score || isNaN(score)) return;

                            try {
                                const res = await fetch("/api/v1/participant/update", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    participantId: participant.id,
                                    essayAnswerId: ans.id,
                                    newScore: score,
                                }),
                                });

                                const response = await res.json();

                                if (!res.ok) {
                                console.error("Failed to update score:", response.message);
                                } else {
                                window.location.reload();
                                }
                            } catch (err) {
                                console.error("Error updating score:", err);
                            }
                            }}>
                            <SelectTrigger className="w-24">
                                <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((score) => (
                                <SelectItem key={score} value={score.toString()}>
                                    {score}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>{`Question ${index + 1}`}</Label>
                        <Label>{question.choice?.questionText ?? "-"}</Label>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Choices</Label>
                        <div className="flex flex-col gap-2">
                        {question.choice?.choices?.map((choice) => (
                            <div
                            key={choice.id}
                            className={`p-2 rounded border ${
                                choice.isCorrect
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200"
                            }`}
                            >
                            <span>{choice.choiceText}</span>
                            </div>
                        ))}
                        </div>
                    </div>

                    {question.choice?.answers?.map((ans, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                        <Label>Selected Answer</Label>
                        <div className="flex flex-col gap-2">
                            {question.choice?.choices
                            ?.filter((choice) => choice.id === ans.selectedChoiceId)
                            .map((choice) => {
                                const isCorrect = ans.score === 1;
                                return (
                                <div
                                    key={choice.id}
                                    className={`p-2 rounded border flex items-center gap-2 ${
                                    isCorrect
                                        ? "border-green-500 bg-green-50"
                                        : "border-red-500 bg-red-50"
                                    }`}
                                >
                                    <span>{choice.choiceText}</span>
                                </div>
                                );
                            })}
                        </div>
                        {/* <Label>Score</Label>
                        <Label>{ans.score ?? "-"}</Label> */}
                        </div>
                    ))}
                    </div>
                )}
                </CardContent>
            </Card>
            );
        })}
        </div>
        </div>
      </div>
    </>
  );
}