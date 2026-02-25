import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { TestTitleEditable } from "@/components/custom/test-title-editable";
import Navbar from "@/components/custom/navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Tests");

  const test = await prisma.test.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!test) notFound();

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Navbar />
      <main className="flex justify-center p-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">
          <Card className="w-full p-6">
            <TestTitleEditable testId={test.id} initialTitle={test.title} />
            <div className="w-full bg-foreground/10 p-4 rounded-lg">
              {/* joinCode */}
            </div>
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
              <Card className="p-6">{t("tabSettings")}</Card>
            </TabsContent>
            <TabsContent value="questions">
              <Card className="p-6">{t("tabQuestions")}</Card>
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
