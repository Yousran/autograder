"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/custom/navbar";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { truncateWords, getInitial, decodeUrlParam } from "@/lib/text";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCreatedTests, getUserTakenTests } from "@/app/actions/user/get";

type CreatedTest = {
  id: string;
  title: string;
  joinCode: string;
  createdAt: string | Date;
};

type TakenTest = {
  id: string;
  score: number;
  createdAt: string | Date;
  test: {
    id: string;
    title: string;
    joinCode: string;
    createdAt: string | Date;
  } | null;
};

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [loading, setLoading] = useState(true);
  const [created, setCreated] = useState<CreatedTest[]>([]);
  const [taken, setTaken] = useState<TakenTest[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [cRes, tRes] = await Promise.all([
          getUserCreatedTests(),
          getUserTakenTests(),
        ]);

        if (!mounted) return;

        if (cRes?.success) setCreated(cRes.data ?? []);
        else if (cRes?.error) {
          console.error("getUserCreatedTests error:", cRes.error);
        }

        if (tRes?.success) setTaken(tRes.participants ?? []);
        else if (tRes?.error) {
          console.error("getUserTakenTest error:", tRes.error);
        }
      } catch (err) {
        console.error("Failed to load user tests:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="grow flex flex-col justify-start items-start p-4 gap-6">
        <div className="w-full flex flex-col items-center gap-4">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
            <AvatarFallback className="text-foreground">
              {getInitial(user?.name)}
            </AvatarFallback>
          </Avatar>
          <Label className="text text-3xl font-bold text-center">
            {decodeUrlParam(username as string)}
          </Label>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-4">
          <div className="w-full flex flex-col items-center gap-4">
            <Label className="text text-xl font-bold text-center">
              Test Taken
            </Label>
            <div className="w-full flex flex-col gap-4">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="flex justify-between gap-4 px-4 py-4 items-center">
                      <div className="w-3/4">
                        <Skeleton className="h-6 w-full" />
                      </div>
                      <div className="w-1/4">
                        <Skeleton className="h-8 w-12 ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : taken.length === 0 ? (
                <Label className="text text-sm justify-center opacity-70">
                  No tests taken
                </Label>
              ) : (
                taken.map((item) => (
                  <Card
                    key={item.id}
                    className="hover:bg-primary/10 hover:scale-101 cursor-pointer transition"
                    onClick={() => router.push(`/test/result/${item.id}`)}
                  >
                    <CardContent className="flex justify-between gap-4 px-4 py-4">
                      <Label className="text text-lg font-bold text-start">
                        {truncateWords(item.test?.title ?? "Untitled")}
                      </Label>
                      <Label className="text text-3xl font-bold text-center">
                        {item.score}
                      </Label>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-4">
            <Label className="text text-xl font-bold text-center">
              Test Created
            </Label>
            <div className="w-full flex flex-col gap-4">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="flex justify-between gap-4 px-4 py-4 items-center">
                      <div className="w-full">
                        <Skeleton className="h-6 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : created.length === 0 ? (
                <Label className="text text-sm justify-center opacity-70">
                  No tests created
                </Label>
              ) : (
                created.map((test) => (
                  <Card
                    key={test.id}
                    className="hover:bg-primary/10 hover:scale-101 cursor-pointer transition"
                    onClick={() => router.push(`/test/${test.joinCode}/edit`)}
                  >
                    <CardContent className="flex justify-between gap-4 px-4 py-4">
                      <Label className="text text-lg font-bold text-start">
                        {truncateWords(test.title)}
                      </Label>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
