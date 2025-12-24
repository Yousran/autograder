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
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ClockIcon, ListIcon, UsersIcon } from "lucide-react";
import { truncateWords } from "@/lib/text";

export default function TestJoinPage() {
  const router = useRouter();
  const { joinCode } = useParams<{ joinCode: string }>();

  const [testData] = useState({
    title: "Sample Test Title",
    description: "This is a placeholder description for the test.",
    testDuration: 60,
  });
  const [username, setUsername] = useState<string | null>(null);
  const [acceptResponses] = useState(true);
  const [participantCount] = useState(5);
  const [questionCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const StartTest = async () => {
    setIsLoading(true);
    try {
      router.push(`/test/${joinCode}/start`);
      toast.success("Test started (placeholder)");
    } catch (error) {
      console.error("Error starting test:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = () => {
    StartTest();
  };

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="grow flex justify-center items-center p-4">
        {testData && !isLoading ? (
          <Card className="w-fit max-w-2xl h-full flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold text-foreground text-center">
              {truncateWords(testData.title)}
            </h1>
            <div className="text-center">
              {testData.description && (
                <p className="text-muted-foreground mb-4">
                  {testData.description}
                </p>
              )}
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
                  <h3 className="text-lg font-semibold">Confirm Start</h3>
                  <AlertDialogDescription>
                    Enter your username and start the test:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <div className="w-full flex flex-col gap-4">
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={username || ""}
                      onChange={(e) => setUsername(e.target.value)}
                    />
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
  );
}
