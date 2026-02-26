import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { TestTitleEditable } from "./components/test-title-editable";
import { SettingsTab } from "./components/settings-tab/settings-tab";
import { JoinCodeCard } from "@/components/custom/join-code-card";
import Navbar from "@/components/custom/navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuestionsTab } from "./components/questions-tab/questions-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Pages.test");

  const test = await prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      joinCode: true,
      joinCodeExpiresAt: true,
      description: true,
      testDuration: true,
      maxAttempts: true,
      isAcceptingResponses: true,
      isLoggedInUserOnly: true,
      isShowDetailedScore: true,
      isShowCorrectAnswers: true,
      isQuestionsOrdered: true,
    },
  });

  if (!test) notFound();

  return (
    <div className="min-h-screen h-fit overflow-hidden flex flex-col">
      <Navbar />
      <main className="flex justify-center p-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">
          <Card className="w-full p-6">
            <TestTitleEditable testId={test.id} initialTitle={test.title} />
            <JoinCodeCard
              testId={test.id}
              initialCode={test.joinCode}
              initialExpiresAt={test.joinCodeExpiresAt}
            />
          </Card>
          <Tabs defaultValue="settings" className="w-full gap-4">
            <TabsList className="w-full border-b">
              <TabsTrigger value="settings">{t("tabSettings")}</TabsTrigger>
              <TabsTrigger value="questions">{t("tabQuestions")}</TabsTrigger>
              <TabsTrigger value="participants">
                {t("tabParticipants")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              <SettingsTab
                testId={test.id}
                initialDescription={test.description}
                initialDuration={test.testDuration}
                initialMaxAttempts={test.maxAttempts}
                initialIsAcceptingResponses={test.isAcceptingResponses}
                initialIsLoggedInUserOnly={test.isLoggedInUserOnly}
                initialIsShowDetailedScore={test.isShowDetailedScore}
                initialIsShowCorrectAnswers={test.isShowCorrectAnswers}
                initialIsQuestionsOrdered={test.isQuestionsOrdered}
              />
            </TabsContent>
            <TabsContent value="questions">
              <QuestionsTab testId={test.id} />
            </TabsContent>
            <TabsContent value="participants">
              <Card className="p-6">{t("tabParticipants")}</Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
