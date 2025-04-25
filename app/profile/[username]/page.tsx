"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getUserDecodedToken, getToken } from "@/lib/auth-client";

type TestTaken = {
  title: string;
  totalScore: number;
};

type TestCreated = {
  title: string;
  joinCode: string;
};

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const isOwner = username === getUserDecodedToken()?.username;
  const [testTaken, setTestTaken] = useState<TestTaken[]>([]);
  const [testCreated, setTestCreated] = useState<TestCreated[]>([]);

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const takenResponse = await fetch("/api/v1/user/tests/taken", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (takenResponse.ok) {
          const takenData = await takenResponse.json();
          setTestTaken(takenData);
        }

        const createdResponse = await fetch("/api/v1/user/tests/created", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (createdResponse.ok) {
          const createdData = await createdResponse.json();
          setTestCreated(createdData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOwner, username]);

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col justify-start items-start p-4 gap-6">
        <div className="w-full flex flex-col items-center gap-4">
          <Avatar className="w-32 h-32">
            <AvatarImage src="#" alt="Profile Picture" />
            <AvatarFallback className="text-2xl">
              {username?.toString().charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <Label className="text text-3xl font-bold text-center">
            {username}
          </Label>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-4">
          {/* Test Taken */}
          <div className="w-full flex flex-col items-center gap-4">
            <Label className="text text-xl font-bold text-center">
              Test Taken
            </Label>
            <div className="w-full flex flex-col gap-4">
              {loading || !isOwner ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="w-full h-14 rounded-lg" />
                  <Skeleton className="w-full h-14 rounded-lg" />
                </div>
              ) : testTaken.length > 0 ? (
                testTaken.map((test, index) => (
                  <Card key={index}>
                    <CardContent className="flex justify-between gap-4 px-4 py-4">
                      <Label className="text text-lg font-bold text-center">
                        {test.title}
                      </Label>
                      <Label className="text text-lg font-bold text-center">
                        {test.totalScore}
                      </Label>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Label className="text-center text-sm text-gray-500">
                  No test taken yet.
                </Label>
              )}
            </div>
          </div>

          {/* Test Created */}
          <div className="w-full flex flex-col items-center gap-4">
            <Label className="text text-xl font-bold text-center">
              Test Created
            </Label>
            <div className="w-full flex flex-col gap-4">
              {loading || !isOwner ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="w-full h-14 rounded-lg" />
                  <Skeleton className="w-full h-14 rounded-lg" />
                </div>
              ) : testCreated.length > 0 ? (
                testCreated.map((test, index) => (
                  <Card
                    key={index}
                    className="hover:bg-primary/10 hover:scale-101 cursor-pointer transition"
                    onClick={() => router.push(`/test/${test.joinCode}/edit`)}
                  >
                    <CardContent className="flex justify-start gap-4 px-4 py-4">
                      <Label className="text text-lg font-bold text-start">
                        {test.title}
                      </Label>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Label className="text-center text-sm text-gray-500">
                  No test created yet.
                </Label>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
