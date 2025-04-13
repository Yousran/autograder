// /app/test/[joinCode]/result/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type ParticipantData = {
    id: number;
    username: string;
    score: number | null;
    testTitle: string;
};

export default function ResultPage() {
    const { joinCode } = useParams<{ joinCode: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [participantData, setParticipantData] = useState<ParticipantData | null>(null);

    useEffect(() => {
        const fetchParticipantData = async () => {
            try {
                const participantToken = Cookies.get("participant");
                if (!participantToken) {
                    throw new Error("Participant token not found");
                }
    
                const res = await fetch("/api/v1/participant/show", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${participantToken}`,
                    },
                    body: JSON.stringify({ joinCode }),
                });
    
                if (!res.ok) {
                    const { message } = await res.json();
                    throw new Error(message || "Failed to fetch participant data");
                }
    
                const fullData = await res.json();
    
                const simplifiedData: ParticipantData = {
                    id: fullData.participantId,
                    username: fullData.participantUsername,
                    score: fullData.totalScore,
                    testTitle: fullData.testTitle,
                };
    
                setParticipantData(simplifiedData);
                Cookies.remove("participant", { path: "/" });
            } catch (err) {
                console.error("Error fetching participant data:", err);
                router.push("/");
            } finally {
                setLoading(false);
            }
        };
    
        fetchParticipantData();
    }, [joinCode, router]);
    

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!participantData) {
        return (
            <div className="p-4">
                <p className="text-red-500">Failed to load participant data.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center p-4 gap-6">
            <Label className="text-3xl font-bold">{participantData.username}</Label>
            <Label className="text text-6xl font-extrabold text-center">
                {participantData.score !== null ? Number(participantData.score.toFixed(2)) : "??"}
            </Label>
            <Label className="text text-2xl font-bold text-center">{participantData.testTitle}</Label>
            <Button
            className="w-full max-w-md"
            onClick={() => router.push("/")}>
                Back to Home
            </Button>
        </div>
    );
}
