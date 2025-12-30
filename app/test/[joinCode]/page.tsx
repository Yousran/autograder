import { getTestByJoinCode } from "@/app/actions/test/get";
import { prisma } from "@/lib/prisma";
import JoinClient from "./join-client";

type Props = { params: { joinCode: string } | Promise<{ joinCode: string }> };

export default async function TestJoinPage({ params }: Props) {
  const resolvedParams = await params;
  const { joinCode } = resolvedParams;

  const res = await getTestByJoinCode(joinCode);

  if (!res.success) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col">
        <main className="grow flex justify-center items-center p-4">
          <div className="text-center">{res.error || "Test not found"}</div>
        </main>
      </div>
    );
  }

  const { test } = res;

  if (!test) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col">
        <main className="grow flex justify-center items-center p-4">
          <div className="text-center">Test not found</div>
        </main>
      </div>
    );
  }

  // Get participant count and question count
  const [participantCount, questionCount] = await Promise.all([
    prisma.participant.count({ where: { testId: test.id } }),
    prisma.question.count({ where: { testId: test.id } }),
  ]);

  return (
    <JoinClient
      test={test}
      participantCount={participantCount}
      questionCount={questionCount}
    />
  );
}
