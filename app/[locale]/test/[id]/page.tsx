import { TestTitleEditable } from "./components/test-title-editable";
import { JoinCodeCard } from "@/components/custom/join-code-card";
import Navbar from "@/components/custom/navbar";
import { Card } from "@/components/ui/card";
import { TestTabs } from "./components/test-tabs";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TestSchema } from "@/lib/schemas/test";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;

  const test = TestSchema.parse(
    await prisma.test.findUnique({
      where: { id },
    }),
  );
  if (!test) {
    notFound();
  }

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
          <TestTabs test={test} />
        </div>
      </main>
    </div>
  );
}
