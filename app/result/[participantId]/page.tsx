"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import Router from "next/router";

const TestResultPage = () => {
    const searchParams = useSearchParams();
    const participantId = searchParams.get("participantId");
    const [score, setScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!participantId) {
                setError("Participant ID not found");
                setLoading(false);
                return;
            }

            try {
                // Fetch participant data including the score
                const response = await fetch(`/api/v1/participant/${participantId}`);
                if (!response.ok) throw new Error("Failed to fetch result");
                
                const data = await response.json();
                setScore(data.total_score);
            } catch {
                setError("Failed to load test result");
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [participantId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading result...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-500">{error}</p>
                    <Button variant="default">Back to Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Test Result</h1>
                <div className="text-6xl font-bold text-primary">
                    {score !== null ? score : '-'}
                </div>
                <p className="text-gray-600">Total Score</p>
            </div>
            
            {/* <Link href="/"> */}
                <Button variant="default">Back to Home</Button>
            {/* </Link> */}
        </div>
    );
};

export default TestResultPage;