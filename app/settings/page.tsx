"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDecodedToken } from "@/lib/auth-client";
import { DecodedToken } from "@/types/token";
import { ThemeSelector } from "@/components/custom/theme-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "appearance">(
    "appearance"
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>();

  useEffect(() => {
    const decoded = getDecodedToken();
    setUser(decoded);
    setIsLoggedIn(!!decoded);
  }, []);

  return (
    <div className="w-screen min-h-screen flex justify-center py-16 p-4">
      <Button
        variant="ghost"
        className="absolute top-4 left-4"
        onClick={() => {
          router.back();
        }}
      >
        <ArrowLeft />
      </Button>
      <main className="w-full max-w-3xl flex justify-center gap-4">
        <Card className="w-2/3 min-h-full p-4">
          {activeTab === "appearance" ? (
            <div className="space-y-4">
              <Label className="text-xl font-semibold">
                Appearance Settings
              </Label>
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
              {/* Tambahkan komponen appearance lainnya di sini */}
            </div>
          ) : isLoggedIn ? (
            <div>
              <Label className="text-xl font-semibold">Profile Settings</Label>
              {/* TODO: Profile Settings */}
              <Label className="text-md font-medium my-2">Username</Label>
              <Button variant="outline" className="w-full" disabled>
                {user?.username}
              </Button>
            </div>
          ) : null}
        </Card>
        <Card className="w-1/3 max-h-fit flex flex-col gap-2 p-4">
          {isLoggedIn ? (
            <Button
              variant={activeTab === "profile" ? "default" : "outline"}
              className="w-full justify-center md:justify-start"
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </Button>
          ) : null}
          <Button
            variant={activeTab === "appearance" ? "default" : "outline"}
            className="w-full justify-center md:justify-start"
            onClick={() => setActiveTab("appearance")}
          >
            Appearance
          </Button>
        </Card>
      </main>
    </div>
  );
}
