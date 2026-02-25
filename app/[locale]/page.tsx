import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div>
      <h1>{t("title")}</h1>
      <Button>{t("getStarted")}</Button>
    </div>
  );
}
