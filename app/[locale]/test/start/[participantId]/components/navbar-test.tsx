"use client";

import { SettingsMenu } from "@/components/custom/settings-menu";

interface NavbarTestProps {
  testTitle: string;
}

/**
 * Top sticky navbar displayed during a test.
 * Shows the test title and question progress.
 */
export function NavbarTest({ testTitle }: NavbarTestProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Title */}
        <h1 className="truncate text-sm font-semibold md:text-base">
          {testTitle}
        </h1>

        {/* Settings */}
        <SettingsMenu />
      </div>
    </header>
  );
}
