import { TestTitleEditable } from "./components/test-title-editable";
import { JoinCodeCard } from "@/components/custom/join-code-card";
import Navbar from "@/components/custom/navbar";
import { Card } from "@/components/ui/card";
import { TestTabs } from "./components/test-tabs";
import { ScrollToTopButton } from "@/components/custom/scroll-to-top-button";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TestSchema } from "@/lib/schemas/test";
import { customAlphabet } from "nanoid";
import type { TestSchema as TestType } from "@/lib/schemas/test";
import { addDays, isPast } from "date-fns";
import { SyncStatusIndicator } from "./components/sync-status-indicator";

/** Human-readable alphabet: no 0/O/1/I to avoid confusion. */
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const TTL_DAYS = 7;
const MAX_RETRIES = 5;

/**
 * Returns the test with a guaranteed non-expired join code.
 * If the current code is missing or expired, a new one is generated and
 * persisted. Called only from the owner-guarded page so no auth check needed.
 */
async function ensureFreshJoinCode(test: TestType): Promise<TestType> {
  const now = new Date();
  const isExpired =
    test.joinCodeExpiresAt !== null && isPast(test.joinCodeExpiresAt);

  if (test.joinCode !== null && !isExpired) return test;

  const expiresAt = addDays(new Date(), TTL_DAYS);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = nanoid();

    const conflict = await prisma.test.findFirst({
      where: {
        joinCode: code,
        id: { not: test.id },
        OR: [{ joinCodeExpiresAt: null }, { joinCodeExpiresAt: { gt: now } }],
      },
      select: { id: true },
    });

    if (conflict) continue;

    const updated = await prisma.test.update({
      where: { id: test.id },
      data: { joinCode: code, joinCodeExpiresAt: expiresAt },
    });

    return TestSchema.parse(updated);
  }

  return test;
}

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const raw = await prisma.test.findUnique({ where: { id } });
  if (!raw) notFound();

  const test = await ensureFreshJoinCode(TestSchema.parse(raw));

  return (
    <div className="min-h-screen h-fit overflow-hidden flex flex-col">
      <Navbar />
      <main className="flex justify-center p-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">
          <Card className="w-full p-6">
            <TestTitleEditable testId={test.id} initialTitle={test.title} />
            <JoinCodeCard
              initialCode={test.joinCode}
              initialExpiresAt={test.joinCodeExpiresAt}
            />
            <div className="flex justify-end">
              <SyncStatusIndicator />
            </div>
          </Card>
          <TestTabs test={test} />
        </div>
      </main>
      <ScrollToTopButton />
    </div>
  );
}
