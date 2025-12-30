import StartPageClient from "./start-page-client";

interface StartPageProps {
  params: Promise<{
    participantId: string;
  }>;
}

export default async function StartPage({ params }: StartPageProps) {
  const { participantId } = await params;

  return <StartPageClient participantId={participantId} />;
}
