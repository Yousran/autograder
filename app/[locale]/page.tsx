import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/custom/navbar";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div>
      <Navbar />
      <h1>{t("title")}</h1>
      <Button>{t("getStarted")}</Button>
    </div>
  );
}
