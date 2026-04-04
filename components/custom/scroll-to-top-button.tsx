"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ScrollToTopButton() {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!visible) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={scrollToTop}
            aria-label={t("Components.scrollToTop.label")}
            className="fixed bottom-1/2 right-6 z-50 size-11 rounded-full p-0 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <ArrowUp className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("Components.scrollToTop.tooltip")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
