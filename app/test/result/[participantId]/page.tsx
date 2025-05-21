// file: /app/test/[joinCode]/result/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Participant } from "@/types/participant";
import { Test } from "@/types/test";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResultPage() {
  const router = useRouter();
  const participantId = useParams().participantId || "";
  const [participant, setParticipant] = useState<Participant>();
  const [test, setTest] = useState<Test>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipantData = async () => {
      try {
        const response = await fetch(`/api/v1/test/result/${participantId}`);
        const data = await response.json();
        if (response.ok) {
          // Menyimpan data peserta dan ujian ke dalam state
          setParticipant(data.participant);
          setTest(data.test);
        } else {
          console.error("Error fetching participant data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching participant data:", error);
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };
    fetchParticipantData();
  }, [participantId]); // Make sure to add participantId as a dependency

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 gap-6">
      {/* Skeleton for participant username */}
      <Label className="text-3xl font-bold">
        {loading ? <Skeleton className="w-40 h-8" /> : participant?.username}
      </Label>
      {/* Skeleton for participant score */}
      <Label className="text text-6xl font-extrabold text-center">
        {loading ? (
          <Skeleton className="w-32 h-12" />
        ) : participant?.score !== null ? (
          Number(participant?.score.toFixed(2))
        ) : (
          "??"
        )}
      </Label>
      {/* Skeleton for test title */}
      <Label className="text text-2xl font-bold text-center">
        {loading ? <Skeleton className="w-64 h-8" /> : test?.title}
      </Label>
      {/* TODO: disable user for accessing the route when showDetailedScore is false */}
      {test?.showDetailedScore && (
        <Button
          variant={"outline"}
          className="w-full max-w-md"
          onClick={() => router.push(`/test/result/${participantId}/details`)}
        >
          See Details
        </Button>
      )}
      <Button className="w-full max-w-md" onClick={() => router.push("/")}>
        Back to Home
      </Button>
    </div>
  );
}
