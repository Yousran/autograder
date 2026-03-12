"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileQuestion, Users, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { JoinStatusResponse } from "@/app/api/tests/join/route";

interface TestInfo {
  id: string;
  title: string;
  description: string | null;
  testDuration: number | null;
  questionCount: number;
  participantCount: number;
  isAcceptingResponses: boolean;
  isLoggedInUserOnly: boolean;
  joinCode: string;
}

interface JoinTestClientProps {
  testInfo: TestInfo;
  /** Pre-filled name from session. Null means the user is a guest. */
  userName: string | null;
  /** Whether the current user is authenticated. */
  isLoggedIn: boolean;
}

export function JoinTestClient({
  testInfo,
  userName,
  isLoggedIn,
}: JoinTestClientProps) {
  const t = useTranslations("Pages.join");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(userName ?? "");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAcceptingResponses, setIsAcceptingResponses] = useState(
    testInfo.isAcceptingResponses,
  );
  const [participantCount, setParticipantCount] = useState(
    testInfo.participantCount,
  );

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/tests/join?joinCode=${testInfo.joinCode}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as JoinStatusResponse;
        setIsAcceptingResponses(data.isAcceptingResponses);
        setParticipantCount(data.participantCount);
      } catch {
        // silently ignore poll errors
      }
    };

    const id = setInterval(() => void poll(), 5000);
    return () => clearInterval(id);
  }, [testInfo.joinCode]);

  const handleStart = () => {
    if (!name.trim()) return;

    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch("/api/tests/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            joinCode: testInfo.joinCode,
          }),
        });

        const data = (await res.json()) as {
          participantId?: string;
          testId?: string;
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? t("cancel"));
          return;
        }

        setOpen(false);
        router.push(`/test/start/${data.participantId}`);
      } catch {
        setError(t("cancel"));
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Test info card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center justify-between gap-2">
              <CardTitle className="text-xl text-center leading-snug">
                {testInfo.title}
              </CardTitle>
              {testInfo.isLoggedInUserOnly && (
                <Badge variant="secondary">{t("loggedInOnly")}</Badge>
              )}
              {testInfo.description && (
                <p className="text-sm text-muted-foreground">
                  {testInfo.description}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<FileQuestion />}
              label={t("questions", { count: testInfo.questionCount })}
            />
            <StatCard
              icon={<Clock />}
              label={
                testInfo.testDuration
                  ? t("duration", { minutes: testInfo.testDuration })
                  : t("noDuration")
              }
            />
            <StatCard
              icon={<Users />}
              label={t("participants", { count: participantCount })}
            />
          </CardContent>
        </Card>

        {/* Start button */}
        {isAcceptingResponses ? (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button size="lg" className="w-full">
                {t("startButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("startDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("startDialogDescription", { title: testInfo.title })}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {!isAcceptingResponses ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{t("notAccepting")}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex flex-col gap-2 py-1">
                    <Label htmlFor="participant-name">{t("nameLabel")}</Label>
                    <Input
                      id="participant-name"
                      placeholder={t("namePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoggedIn}
                      autoFocus={!isLoggedIn}
                    />
                    {isLoggedIn && (
                      <p className="text-xs text-muted-foreground">
                        {t("nameFromAccount")}
                      </p>
                    )}
                    {error && (
                      <Alert variant="destructive" className="mt-1">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                      {t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleStart();
                      }}
                      disabled={isPending || !name.trim()}
                    >
                      {isPending ? <Spinner /> : t("confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </>
              )}
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{t("notAccepting")}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border bg-muted/40 p-3 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-medium leading-tight">{label}</span>
    </div>
  );
}
