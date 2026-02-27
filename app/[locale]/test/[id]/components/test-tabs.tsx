"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsTab } from "./settings-tab/settings-tab";
import { QuestionsTab } from "./questions-tab/questions-tab";
import { TestSchema } from "@/lib/schemas/test";

interface TestTabsProps {
  test: TestSchema;
}

export function TestTabs({ test }: TestTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Pages.test");
  const currentTab = searchParams.get("tab") || "settings";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="w-full gap-4"
    >
      <TabsList className="w-full border-b">
        <TabsTrigger value="settings">{t("tabSettings")}</TabsTrigger>
        <TabsTrigger value="questions">{t("tabQuestions")}</TabsTrigger>
        <TabsTrigger value="participants">{t("tabParticipants")}</TabsTrigger>
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
  );
}
