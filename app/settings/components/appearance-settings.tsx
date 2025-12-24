// file: app/settings/components/appearance-settings.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-dropdown-menu";
import { ThemeSelector } from "@/components/custom/theme-selector";

export function AppearanceSettings() {
  return (
    <div className="space-y-4">
      <Label className="text-xl font-semibold">Appearance Settings</Label>
      <Label className="text-md font-medium my-2">Theme</Label>
      <ThemeSelector />
      <Label className="text-md font-medium my-2 text-muted-foreground">
        Language
      </Label>
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="w-full" disabled>
          Bahasa Indonesia
        </Button>
        <Button variant="outline" className="w-full" disabled>
          English
        </Button>
      </div>
    </div>
  );
}
