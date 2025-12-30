"use client";

import Navbar from "@/components/custom/navbar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ClockIcon, ListIcon, UsersIcon } from "lucide-react";
import { truncateWords } from "@/lib/text";
import { authClient } from "@/lib/auth-client";
import { createParticipant } from "@/app/actions/participant/create";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  participantJoinSchema,
  type ParticipantJoinValidation,
} from "@/types/participant";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Test } from "@/types/test";

export default function JoinClient({
  test,
  participantCount,
  questionCount,
}: {
  test: Test;
  participantCount: number;
  questionCount: number;
}) {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const acceptResponses = test?.isAcceptingResponses ?? true;
  const isAuthenticated = !!session?.user;

  // Form for guest users
  const form = useForm<ParticipantJoinValidation>({
    resolver: zodResolver(participantJoinSchema),
    defaultValues: {
      joinCode: test.joinCode,
      name: "",
    },
  });

  const handleStartTest = async (data?: ParticipantJoinValidation) => {
    // For authenticated users, no form data needed - use session name
    // For guests, validate form data
    if (!isAuthenticated && !data) {
      const isValid = await form.trigger();
      if (!isValid) {
        toast.error("Please enter your name");
        return;
      }
      return; // Let the form submission handle it
    }

    setIsLoading(true);
    try {
      const participantData: ParticipantJoinValidation = {
        joinCode: test.joinCode,
        name: isAuthenticated
          ? session.user.name || session.user.email || "Unknown"
          : data?.name || "",
      };

      const result = await createParticipant(participantData);

      if (!result.success) {
        toast.error(result.error || "Failed to join test");
        setIsLoading(false);
        return;
      }

      // Success - navigate to test start page
      toast.success("Starting test...");
      router.push(`/test/start/${result.participantId}`);
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Failed to start test");
      setIsLoading(false);
    }
  };

  if (!test || isSessionLoading) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col">
        <main className="grow flex justify-center items-center p-4">
          <Skeleton className="w-64 h-64" />
        </main>
      </div>
    );
  }

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="grow flex justify-center items-center p-4">
        <Card className="w-fit max-w-2xl h-full flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-foreground text-center">
            {truncateWords(test.title)}
          </h1>
          <div className="text-center">
            {test.description && (
              <p className="text-muted-foreground mb-4">{test.description}</p>
            )}
            <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <ClockIcon className="w-12 h-12 text-muted-foreground" />
                <span className="text-lg text-muted-foreground">
                  {test.testDuration ?? 0} minutes
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
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button disabled={!acceptResponses} className="w-full">
                Start Test
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-semibold">
                  {isAuthenticated ? "Start Test" : "Enter Your Name"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isAuthenticated
                    ? `You are logged in as ${
                        session.user.name || session.user.email
                      }. Click confirm to start the test.`
                    : "Please enter your name to start the test:"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <div className="w-full flex flex-col gap-4">
                  {!isAuthenticated ? (
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleStartTest)}
                        className="w-full flex flex-col gap-4"
                      >
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Enter your name"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      form.handleSubmit(handleStartTest)();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <AlertDialogCancel disabled={isLoading}>
                            Cancel
                          </AlertDialogCancel>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Loading..." : "Confirm"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <AlertDialogCancel disabled={isLoading}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          onClick={() => handleStartTest()}
                          disabled={isLoading}
                        >
                          {isLoading ? "Loading..." : "Confirm"}
                        </Button>
                      </AlertDialogAction>
                    </div>
                  )}
                </div>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </main>
    </div>
  );
}
