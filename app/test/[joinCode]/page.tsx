// app/test/[joinCode]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Navbar from "@/components/custom/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DecodedToken = {
  userId: number;
  email: string;
  username: string;
  exp: number;
  iat: number;
};

export default function Test() {
  const { joinCode } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [testData, setTestData] = useState<{
    testTitle: string;
    testDuration: number;
    participantCount: number;
    acceptResponses: boolean;
    questionCount: { id: number }[];
  } | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      const res = await fetch(`/api/v1/test/show?joinCode=${joinCode}`);
      const data = await res.json();
      if (res.ok) {
        setTestData({
          ...data,
        });
      } else {
        toast.error("Failed to fetch test data", { description: data.message });
      }
      setLoading(false);
    };

    fetchTest();
    const interval = setInterval(fetchTest, 5000);

    return () => clearInterval(interval);
  }, [joinCode]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setIsLoggedIn(true);
        if (decoded.username) {
          setUsername(decoded.username);
        }
      } catch (error) {
        console.error("Invalid token", error);
        Cookies.remove("token");
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleStartTest = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token");
      const res = await fetch("/api/v1/participant/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ joinCode, username }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Berhasil bergabung!", {
          description: "Kamu akan diarahkan ke halaman ujian.",
        });
        Cookies.set("participant", data.participant, { path: "/" });
        router.push(`/test/${joinCode}/start`);
      } else {
        setIsLoading(false);
        toast.error("Gagal bergabung", { description: data.message });
      }
    } catch (err) {
      setIsLoading(false);
      console.error(err);
      toast.error("Terjadi kesalahan saat memulai test");
    }
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
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-2xl flex flex-col justify-center gap-6">
          {/* Test Configuration */}
          <Card className="w-full shadow-lg rounded-2xl">
            <CardContent className="flex flex-col gap-4 p-4">
              <h2 className="text-2xl font-semibold">{testData.testTitle}</h2>
              <p className="text-sm">{`Duration: ${testData.testDuration} minutes`}</p>
              <p className="text-sm">{`Participants: ${testData.participantCount}`}</p>
              {!isLoggedIn && (
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}
                <Button
                className="w-full"
                disabled={isLoading || !testData.acceptResponses || username.trim() === ""}
                onClick={handleStartTest}
                >
                {testData.acceptResponses ? "Start Test" : "Test is not accepting responses"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
