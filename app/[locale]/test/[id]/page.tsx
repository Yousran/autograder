interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test</h1>
      <p className="text-muted-foreground mt-1 font-mono text-sm">ID: {id}</p>
    </div>
  );
}
