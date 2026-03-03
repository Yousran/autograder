"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsTab } from "./settings-tab/settings-tab";
import { QuestionsTab } from "./questions-tab/questions-tab";
import { TestSchema } from "@/lib/schemas/test";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ParticipantsTab } from "./participants-tab/participants-tab";

interface TestTabsProps {
  test: TestSchema;
}

export function TestTabs({ test }: TestTabsProps) {
  const t = useTranslations("Pages.test");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = new Set(["settings", "questions", "participants"]);
  const [currentTab, setCurrentTab] = useState(() => {
    const p = searchParams?.get("tab");
    return allowed.has(p ?? "") ? (p as string) : "settings";
  });

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    try {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`);
    } catch (e) {
      console.error("Failed to update URL search params:", e);
    }
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
        <ParticipantsTab testId={test.id} />
      </TabsContent>
    </Tabs>
  );
}
