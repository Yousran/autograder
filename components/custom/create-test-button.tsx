"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  defaultTestResponse,
  testResponseSchema,
  type TestResponse,
} from "@/lib/schemas/test";
import { useTranslations } from "next-intl";

export function CreateTestButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("Components.createTestButton");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    // Optimistic placeholder — same shape as the real response.
    const optimistic: TestResponse = {
      ...defaultTestResponse,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    void optimistic; // available for optimistic UI if needed
    try {
      const res = await fetch("/api/tests/create", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data: TestResponse = testResponseSchema.parse(await res.json());
      router.push(`/test/${data.id}`);
    } catch (error) {
      console.error(t("createFailed"), error);
      setLoading(false);
    }
  };

  return (
    <Button className={className} onClick={handleCreate} disabled={loading}>
      {loading ? <Spinner /> : t("createTest")}
    </Button>
  );
}
