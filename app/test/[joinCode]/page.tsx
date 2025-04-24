<<<<<<< HEAD
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
=======
"use client";
import Navbar from "@/components/custom/navbar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserDecodedToken, getToken, setToken } from "@/lib/auth-client";
import { UserDecodedToken } from "@/types/token";
import { AlertDialogTitle } from "@radix-ui/react-alert-dialog";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Test } from "@/types/test";
import { Input } from "@/components/ui/input";
import { ClockIcon, ListIcon, UsersIcon } from "lucide-react";

export default function TestJoinPage() {
  const router = useRouter();
  const { joinCode } = useParams<{ joinCode: string }>();
  const [testData, setTestData] = useState<Test | null>(null);
  const [user, setUser] = useState<UserDecodedToken | null>();
  const [username, setUsername] = useState<string | null>(null);
  const [acceptResponses, setAcceptResponses] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUser(getUserDecodedToken());
    console.log("User decoded token:", getUserDecodedToken());
    setUsername(getUserDecodedToken()?.username || null);
  }, []);

  const StartTest = async () => {
    setIsLoading(true);
    try {
      console.log("Starting test with username:", username);
      const res = await fetch(`/api/v1/test/${joinCode}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          userId: user?.userId,
          username,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setToken("participantId", data.participantId);
        toast.success("Test started successfully!");
        router.push(`/test/${joinCode}/start`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error starting test:", error);
    }
    setIsLoading(false);
  };

  const handleStartTest = () => {
    StartTest();
  };

  useEffect(() => {
    const fetchTest = async () => {
      const response = await fetch(`/api/v1/test/${joinCode}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        toast.error("Failed to fetch test data");
      }
      const data = await response.json();
      setTestData(data);
    };
    fetchTest();
  }, [joinCode]);

  useEffect(() => {
    const fetchPoolingData = async () => {
      try {
        const response = await fetch(`/api/v1/test/${joinCode}/pooling`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch pooling data");
          return;
        }

        const data = await response.json();
        console.log("Initial pooling data:", data);
        setAcceptResponses(data.acceptResponses);
        setParticipantCount(data.participantCount);
        setQuestionCount(data.questionCount);
      } catch (error) {
        console.error("Error during pooling fetch:", error);
      }
    };

    // Call once immediately
    fetchPoolingData();

    // Setup interval
    const interval = setInterval(fetchPoolingData, 10000);
    return () => clearInterval(interval);
  }, [joinCode]);

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex justify-center items-center">
        {testData && !isLoading ? (
          <Card className="w-fit h-full flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold text-foreground">
              {testData.title}
            </h1>
            <div className="text-center space-y-6">
              <p className="text-muted-foreground">{testData.description}</p>
              <div className="flex justify-center gap-8">
                <div className="flex flex-col items-center">
                  <ClockIcon className="w-12 h-12 text-muted-foreground" />
                  <span className="text-lg text-muted-foreground">
                    {testData.testDuration} minutes
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <ListIcon className="w-12 h-12 text-muted-foreground" />
                  <span className="text-lg text-muted-foreground">
                    {questionCount} Questions
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <UsersIcon className="w-12 h-12 text-muted-foreground" />
                  <span className="text-lg text-muted-foreground">
                    {participantCount} Participants
                  </span>
                </div>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!acceptResponses} className="w-full">
                  Start Test
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Start</AlertDialogTitle>
                  <AlertDialogDescription>
                    {user
                      ? "Are you sure you want to start the test?"
                      : "Enter your username and start the test:"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <div className="w-full flex flex-col gap-4">
                    {!user ? (
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={username || ""}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    ) : null}
                    <div className="flex justify-end gap-2">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleStartTest}>
                        Confirm
                      </AlertDialogAction>
                    </div>
                  </div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        ) : (
          <Skeleton className="w-64 h-64" />
        )}
      </main>
    </div>
>>>>>>> baru/main
  );
}
