"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function CreateTestButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("Tests");
  const handleCreate = async () => {
    const res = await fetch("/api/tests/init", { method: "POST" });
    const data = await res.json();

    router.push(`/test/${data.id}/edit`);
  };

  return (
    <Button className={className} onClick={handleCreate}>
      {t("createTest")}
    </Button>
  );
}
