// file: components/custom/theme-selector.tsx
"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full h-fit flex flex-col md:flex-row items-center justify-center gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("light")}
        className="w-full flex-1 gap-2 p-2"
      >
        <Sun className="h-4 w-4" />
        Light
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="w-full flex-1 gap-2 p-2"
      >
        <Moon className="h-4 w-4" />
        Dark
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("system")}
        className="w-full flex-1 gap-2 p-2"
      >
        <Monitor className="h-4 w-4" />
        System
      </Button>
    </div>
  );
}
