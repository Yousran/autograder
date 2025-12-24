"use client";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { truncateWords, getInitial } from "@/lib/text";

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const placeholderTaken = [
    { title: "Introduction to Algebra", score: 92, id: "p1" },
    { title: "History Basics", score: 85, id: "p2" },
    { title: "Creative Writing Exercise", score: 78, id: "p3" },
  ];

  const placeholderCreated = [
    { title: "Midterm Review", joinCode: "JOIN123" },
    { title: "Final Practice Test", joinCode: "JOIN456" },
    { title: "Pop Quiz", joinCode: "JOIN789" },
  ];

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
            {username}
          </Label>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-4">
          <div className="w-full flex flex-col items-center gap-4">
            <Label className="text text-xl font-bold text-center">
              Test Taken
            </Label>
            <div className="w-full flex flex-col gap-4">
              {placeholderTaken.map((test, index) => (
                <Card
                  key={index}
                  className="hover:bg-primary/10 hover:scale-101 cursor-pointer transition"
                  onClick={() => router.push(`/test/result/${test.id}`)}
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
              ))}
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-4">
            <Label className="text text-xl font-bold text-center">
              Test Created
            </Label>
            <div className="w-full flex flex-col gap-4">
              {placeholderCreated.map((test, index) => (
                <Card
                  key={index}
                  className="hover:bg-primary/10 hover:scale-101 cursor-pointer transition"
                  onClick={() => router.push(`/test/${test.joinCode}/edit`)}
                >
                  <CardContent className="flex justify-between gap-4 px-4 py-4">
                    <Label className="text text-lg font-bold text-start">
                      {truncateWords(test.title)}
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
