<<<<<<< HEAD
// app/profile/[username]/page.tsx
"use client";

=======
"use client";
>>>>>>> baru/main
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
<<<<<<< HEAD
import { jwtDecode } from "jwt-decode";

type TestTaken = {
  testTitle: string;
=======
import { getUserDecodedToken, getToken } from "@/lib/auth-client";

type TestTaken = {
  title: string;
>>>>>>> baru/main
  totalScore: number;
};

type TestCreated = {
<<<<<<< HEAD
  testTitle: string;
  joinCode: string;
};

type DecodedToken = {
  userId: number;
  username: string;
  email: string;
};

=======
  title: string;
  joinCode: string;
};

>>>>>>> baru/main
export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [isOwner, setIsOwner] = useState(false);
=======
  const isOwner = username === getUserDecodedToken()?.username;
>>>>>>> baru/main
  const [testTaken, setTestTaken] = useState<TestTaken[]>([]);
  const [testCreated, setTestCreated] = useState<TestCreated[]>([]);

  useEffect(() => {
<<<<<<< HEAD
    const loadProfileData = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        setLoading(false);
        return;
      }

      const decoded = jwtDecode(token) as DecodedToken;
      const isCurrentUser = decoded.username === username;
      setIsOwner(isCurrentUser);

      if (isCurrentUser) {
        const [takenRes, createdRes] = await Promise.all([
          fetch("/api/v1/tests/taken", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/v1/tests/created", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (takenRes.ok) {
          const takenData = await takenRes.json();
          setTestTaken(takenData.tests);
        }

        if (createdRes.ok) {
          const createdData = await createdRes.json();
          setTestCreated(createdData.tests);
        }
      }

      setLoading(false);
    };

    loadProfileData();
  }, [username]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-start items-center min-h-screen pt-16">
        <div className="w-full h-full flex flex-col justify-center items-center gap-6 p-6">
=======
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
>>>>>>> baru/main
          <Avatar className="w-32 h-32">
            <AvatarImage src="#" alt="Profile Picture" />
            <AvatarFallback className="text-2xl">
              {username?.toString().charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
<<<<<<< HEAD
          <Label className="text text-3xl font-bold text-center">{username}</Label>

          <div className="w-full flex flex-col md:flex-row gap-4">
            {/* Test Taken */}
            <div className="w-full flex flex-col items-center gap-4">
              <Label className="text text-xl font-bold text-center">Test Taken</Label>
              <div className="w-full flex flex-col gap-4">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-14 rounded-lg" />
                  ))
                ) : isOwner ? (
                  testTaken.length > 0 ? (
                    testTaken.map((test, index) => (
                      <Card key={index}>
                        <CardContent className="flex justify-between gap-4 px-4 py-4">
                          <Label className="text text-lg font-bold text-center">{test.testTitle}</Label>
                          <Label className="text text-lg font-bold text-center">{test.totalScore}</Label>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Label className="text-center text-sm text-gray-500">No test taken yet.</Label>
                  )
                ) : (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-14 rounded-lg" />
                  ))
                )}
              </div>
            </div>

            {/* Test Created */}
            <div className="w-full flex flex-col items-center gap-4">
              <Label className="text text-xl font-bold text-center">Test Created</Label>
              <div className="w-full flex flex-col gap-4">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-14 rounded-lg" />
                  ))
                ) : isOwner ? (
                  testCreated.length > 0 ? (
                    testCreated.map((test, index) => (
                      <Card
                        key={index}
                        className="hover:bg-gray-100 cursor-pointer transition"
                        onClick={() => router.push(`/test/${test.joinCode}/edit`)}
                      >
                        <CardContent className="flex justify-start gap-4 px-4 py-4">
                          <Label className="text text-lg font-bold text-center">{test.testTitle}</Label>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Label className="text-center text-sm text-gray-500">No test created yet.</Label>
                  )
                ) : (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-14 rounded-lg" />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
=======
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
                    className="hover:bg-primary/10 cursor-pointer transition"
                    onClick={() => router.push(`/test/${test.joinCode}/edit`)}
                  >
                    <CardContent className="flex justify-start gap-4 px-4 py-4">
                      <Label className="text text-lg font-bold text-center">
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
>>>>>>> baru/main
  );
}
