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

export default function TestJoinPage() {
  const router = useRouter();
  const { joinCode } = useParams<{ joinCode: string }>();
  const [testData, setTestData] = useState<Test | null>(null);
  const [user, setUser] = useState<UserDecodedToken | null>();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUserDecodedToken());
    console.log("User decoded token:", getUserDecodedToken());
    setUsername(getUserDecodedToken()?.username || null);
  }, []);

  const StartTest = async () => {
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
        toast.error("Failed to start test: " + data.message);
      }
    } catch (error) {
      console.error("Error starting test:", error);
    }
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

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex justify-center items-center">
        {testData ? (
          <Card className="w-fit h-full flex flex-col items-center justify-center p-4">
            <>
              <h1 className="text-xl font-bold">{testData.title}</h1>
              <p className="text-gray-600">{testData.description}</p>
              <p className="text-gray-500">{testData.testDuration} minutes</p>
              <p className="text-gray-500">Join Code: {testData.joinCode}</p>
            </>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>Start Test</Button>
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
                  {!user ? (
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={username || ""}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full mb-4"
                    />
                  ) : null}
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStartTest}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        ) : (
          <Skeleton className="w-64 h-64" />
        )}
      </main>
    </div>
  );
}
