"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

export function CreateTestButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("Components.createTestButton");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tests/init", { method: "POST" });
      const data = await res.json();
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
