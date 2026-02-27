"use client";

import { useState } from "react";
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
  const t = useTranslations("Pages.test");
  const [currentTab, setCurrentTab] = useState("settings");

  return (
    <Tabs
      value={currentTab}
      onValueChange={setCurrentTab}
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
