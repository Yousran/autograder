//app/test/[joinCode]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/custom/navbar";

export default function TestJoinPage() {
  const { joinCode } = useParams();
  const router = useRouter();

  const [testData, setTestData] = useState<{ test_title: string; test_duration: number; total_questions: number } | null>(null);
  const [acceptResponses, setAcceptResponses] = useState<boolean | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    if (!joinCode) return;
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    const fetchData = async () => {
      try {
        const testRes = await fetch(`/api/v1/test/${joinCode}`);
        const testJson = await testRes.json();
        setTestData(testJson);

        const acceptRes = await fetch(`/api/v1/test/${joinCode}/accept-responses`);
        const acceptJson = await acceptRes.json();
        setAcceptResponses(acceptJson.accept_responses);

        const participantsRes = await fetch(`/api/v1/test/${joinCode}/count-participants`);
        const participantsJson = await participantsRes.json();
        setParticipantCount(participantsJson.participant_count);

      } catch (error) {
        console.error("Error fetching test data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [joinCode]);

  const startTest = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/start-test", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ username, joinCode, startTime: new Date().toISOString() }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Test started successfully!");
        localStorage.setItem("participant", JSON.stringify(result.participant));
        router.push(`/app/test/${joinCode}/start`);
      } else {
        alert(result.error || "Failed to start test");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="w-full flex justify-center items-center">
        <div className="w-full sm:w-2/5 flex flex-col justify-center items-center p-4 gap-4">
          <h1 className="w-full text-3xl font-bold text-center mt-4">
            {testData ? testData.test_title : "Loading..."}
          </h1>
          <div className="w-full flex justify-center items-center gap-4">
            <Card className="w-full flex flex-col items-center p-4">
              <i className="bx bx-time text-7xl"></i>
              <p className="text-lg font-semibold text-primary">
                {testData ? `${testData.test_duration} min` : "Loading..."}
              </p>
            </Card>
            <Card className="w-full flex flex-col items-center p-4">
              <i className="bx bx-list-ol text-7xl"></i>
              <p className="text-lg font-semibold text-primary">
                {testData ? `${testData.total_questions} Questions` : "Loading..."}
              </p>
            </Card>
            <Card className="w-full flex flex-col items-center p-4">
              <i className="bx bx-group text-7xl"></i>
              <p className="text-lg font-semibold text-primary">
                {participantCount !== null ? `${participantCount} Users` : "Loading..."}
              </p>
            </Card>
          </div>
          {!isAuthenticated ? (
            <Input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
            />
          ) : null}
          <Button
            variant="default"
            className="w-full"
            disabled={!acceptResponses || loading}
            onClick={startTest}
          >
            {loading ? "Starting..." : acceptResponses === false ? "Test Closed" : "Start Test"}
          </Button>
        </div>
      </div>
    </>
  );
}