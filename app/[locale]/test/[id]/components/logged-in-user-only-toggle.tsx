"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Props {
  testId: string;
  initialValue: boolean;
}

export function LoggedInUserOnlyToggle({ testId, initialValue }: Props) {
  const tApiTests = useTranslations("Api.tests");
  const [checked, setChecked] = useState(initialValue);

  async function handleCheckedChange(next: boolean) {
    setChecked(next);

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLoggedInUserOnly: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? tApiTests("updateFailed"),
        );
        setChecked(!next);
        return;
      }

      toast.success(tApiTests("updateSuccess"));
    } catch {
      toast.error(tApiTests("updateFailed"));
      setChecked(!next);
    }
  }

  return <Switch checked={checked} onCheckedChange={handleCheckedChange} />;
}
