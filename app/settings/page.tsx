// file: app/settings/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AppearanceSettings } from "./components/appearance-settings";
import { ProfileSettings } from "./components/profile-settings";
import { SecuritySettings } from "./components/security-settings";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("appearance");

  return (
    <div className="w-screen min-h-screen flex justify-center py-16 p-4">
      <Button
        variant="ghost"
        className="absolute top-4 left-4"
        onClick={() => router.back()}
        aria-label="Go back"
      >
        <ArrowLeft />
      </Button>
      <main className="w-full max-w-3xl flex justify-center gap-4">
        <Card className="w-2/3 min-h-full p-4">
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "security" && <SecuritySettings />}
        </Card>
        <Card className="w-1/3 max-h-fit flex flex-col gap-2 p-4">
          <Button
            onClick={() => setActiveTab("profile")}
            variant={activeTab === "profile" ? "default" : "outline"}
            className="w-full justify-center md:justify-start"
          >
            Profile
          </Button>
          <Button
            onClick={() => setActiveTab("security")}
            variant={activeTab === "security" ? "default" : "outline"}
            className="w-full justify-center md:justify-start"
          >
            Security
          </Button>
          <Button
            onClick={() => setActiveTab("appearance")}
            variant={activeTab === "appearance" ? "default" : "outline"}
            className="w-full justify-center md:justify-start"
          >
            Appearance
          </Button>
        </Card>
      </main>
    </div>
  );
}
