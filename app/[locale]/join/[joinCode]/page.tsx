import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/dal";
import { JoinTestClient } from "@/components/custom/join-test-client";
import Navbar from "@/components/custom/navbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ joinCode: string; locale: string }>;
}

export default async function JoinTestPage({ params }: PageProps) {
  const { joinCode } = await params;
  const t = await getTranslations("Pages.join");

  const test = await prisma.test.findUnique({
    where: { joinCode },
    select: {
      id: true,
      title: true,
      description: true,
      testDuration: true,
      isAcceptingResponses: true,
      isLoggedInUserOnly: true,
      joinCodeExpiresAt: true,
      joinCode: true,
      _count: {
        select: {
          questions: true,
          participants: true,
        },
      },
    },
  });

  if (!test || !test.joinCode) {
    notFound();
  }

  const isExpired =
    test.joinCodeExpiresAt !== null && test.joinCodeExpiresAt < new Date();

  if (isExpired) {
    notFound();
  }

  const session = await getSession();
  const isLoggedIn = !!session;

  /** If the test requires login but user is a guest, show an info alert. */
  if (test.isLoggedInUserOnly && !isLoggedIn) {
    return (
      <div className="h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{t("loggedInOnly")}</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  const testInfo = {
    id: test.id,
    title: test.title,
    description: test.description,
    testDuration: test.testDuration,
    questionCount: test._count.questions,
    participantCount: test._count.participants,
    isAcceptingResponses: test.isAcceptingResponses,
    isLoggedInUserOnly: test.isLoggedInUserOnly,
    joinCode: test.joinCode,
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <JoinTestClient
          testInfo={testInfo}
          userName={session?.user.name ?? null}
          isLoggedIn={isLoggedIn}
        />
      </main>
    </div>
  );
}
