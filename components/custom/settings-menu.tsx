"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Globe,
  Building,
  Layout,
  Coffee,
  Palette,
  Code,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "../ui/button";

// Available style classes
const STYLE_CLASSES = [
  "neo-brutalism",
  "caffeine",
  "pastel-dreams",
  "vs-code",
  "art-deco",
] as const;

export function SettingsMenu() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Initialize state from localStorage using lazy initializer
  const [style, setStyle] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem("ui-style") || "default";
  });

  // 2. Apply HTML class when style changes
  useEffect(() => {
    const html = document.documentElement;

    // Remove all style classes
    STYLE_CLASSES.forEach((styleClass) => {
      html.classList.remove(styleClass);
    });

    // Add the new style class if not default (ensuring consistent order: style then theme)
    if (style !== "default") {
      // Remove and re-add style class to ensure it comes before theme class
      html.classList.remove(style);
      html.classList.add(style);
    }
  }, [style]);

  // 4. Handle toggling the style
  function handleStyleChange(newStyle: string) {
    setStyle(newStyle);
    localStorage.setItem("ui-style", newStyle);
  }

  function handleLocaleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings />
              <span className="sr-only">
                {t("Components.settingsMenu.settings")}
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t("Components.settingsMenu.settings")}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-48">
        {/* Theme */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Monitor className="size-3.5" />
          {t("Components.settingsMenu.theme")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="system" className="gap-2">
            <Monitor className="size-4" />
            {t("Components.settingsMenu.themeSystem")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light" className="gap-2">
            <Sun className="size-4" />
            {t("Components.settingsMenu.themeLight")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="gap-2">
            <Moon className="size-4" />
            {t("Components.settingsMenu.themeDark")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Language Section */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="size-3.5" />
          {t("Components.settingsMenu.language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={handleLocaleChange}
        >
          <DropdownMenuRadioItem value="en" className="gap-2">
            🇬🇧 English
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="id" className="gap-2">
            🇮🇩 Indonesia
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Design Style Section */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layout className="size-3.5" />
          {t("Components.settingsMenu.designStyle")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={style} onValueChange={handleStyleChange}>
          <DropdownMenuRadioItem value="default" className="gap-2">
            <Layout className="size-4" />
            Default
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="pastel-dreams" className="gap-2">
            <Palette className="size-4" />
            Pastel Dreams
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="neo-brutalism" className="gap-2">
            <Building className="size-4" />
            Neo-Brutalism
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="caffeine" className="gap-2">
            <Coffee className="size-4" />
            Caffeine
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="vs-code" className="gap-2">
            <Code className="size-4" />
            VS Code
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="art-deco" className="gap-2">
            <Palette className="size-4" />
            Art Deco
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
