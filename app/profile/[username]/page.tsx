"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { truncateWords } from "@/lib/text";

type TestTaken = {
  title: string;
  score: number;
  participantId: string;
};

type TestCreated = {
  title: string;
  joinCode: string;
};

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const user = session?.user;

  // Decode the username from URL and compare with user data
  const decodedUsername = decodeURIComponent(username?.toString() || "");
  // Check if viewing own profile (match name or email)
  const isOwner =
    user && (decodedUsername === user.name || decodedUsername === user.email);

  const [testTaken, setTestTaken] = useState<TestTaken[]>([]);
  const [testCreated, setTestCreated] = useState<TestCreated[]>([]);

  useEffect(() => {
    // Only fetch data if user is logged in and viewing their own profile
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if this is the user's own profile
    if (!isOwner) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [takenResponse, createdResponse] = await Promise.all([
          fetch("/api/v1/user/tests/taken"),
          fetch("/api/v1/user/tests/created"),
        ]);

        if (takenResponse.ok) {
          const takenData = await takenResponse.json();
          setTestTaken(takenData);
        }

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
  }, [isOwner, user]);

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col justify-start items-start p-4 gap-6">
        <div className="w-full flex flex-col items-center gap-4">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user?.image || undefined} alt="Profile Picture" />
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
                  <Card
                    key={index}
                    className="hover:bg-primary/10 hover:scale-101 cursor-pointer transition"
                    onClick={() =>
                      router.push(`/test/result/${test.participantId}`)
                    }
                  >
                    <CardContent className="flex justify-between gap-4 px-4 py-4">
                      <Label className="text text-lg font-bold text-start">
                        {truncateWords(test.title)}
                      </Label>
                      <Label className="text text-3xl font-bold text-center">
                        {test.score}
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
                      <Label className="text text-lg font-bold text-start overflow-ellipsis">
                        {truncateWords(test.title)}
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
