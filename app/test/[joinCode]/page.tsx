import { getTestByJoinCode } from "@/app/actions/test/get";
import JoinClient from "./join-client";

type Props = { params: { joinCode: string } | Promise<{ joinCode: string }> };

export default async function TestJoinPage({ params }: Props) {
  const resolvedParams = await params;
  const { joinCode } = resolvedParams;

  const res = await getTestByJoinCode(joinCode);

  if ("error" in res) {
    return (
      <div className="max-w-screen min-h-screen flex flex-col">
        <main className="grow flex justify-center items-center p-4">
          <div className="text-center">Test not found.</div>
        </main>
      </div>
    );
  }

  const { test } = res;

  return <JoinClient test={test} />;
}
