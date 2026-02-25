import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestTitleEditable } from "@/components/custom/test-title-editable";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!test) notFound();

  return (
    <div className="p-8">
      <TestTitleEditable testId={test.id} initialTitle={test.title} />
      <p className="text-muted-foreground mt-1 font-mono text-sm">ID: {id}</p>
    </div>
  );
}
