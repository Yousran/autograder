"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TestSchema, defaultTestData } from "@/lib/schemas/test";
import type { Test } from "@/lib/generated/prisma/client";
import { useTranslations } from "next-intl";

export function CreateTestButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    // Optimistic placeholder — same shape as the real server data.
    const optimistic: Test = {
      ...defaultTestData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    void optimistic; // available for optimistic UI if needed
    try {
      const res = await fetch("/api/tests/create", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data: Test = TestSchema.parse(await res.json());
      router.push(`/test/${data.id}`);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <Button
      className={className}
      onClick={handleCreate}
      disabled={loading}
      data-testid="btn-create-test"
    >
      {loading ? <Spinner /> : t("Components.createTestButton.createTest")}
    </Button>
  );
}
