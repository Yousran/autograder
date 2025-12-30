"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTest } from "@/app/actions/test/create";
import { Loader2 } from "lucide-react";

export default function CreateTestPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCreate = async () => {
      const result = await createTest();
      if (result.success && result.joinCode) {
        router.replace(`/test/${result.joinCode}/edit`);
      } else {
        // If creation fails, redirect back to home
        router.replace("/");
      }
    };

    handleCreate();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Creating your test...</p>
    </div>
  );
}
