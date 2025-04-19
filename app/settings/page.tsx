// file: app/settings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDecodedToken } from "@/lib/auth-client";
import { DecodedToken } from "@/types/token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AppearanceSettings } from "./components/appearance-settings";
import { ProfileSettings } from "./components/profile-settings";
import { SecuritySettings } from "./components/security-settings";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "appearance" | "security"
  >("appearance");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const decoded = getDecodedToken();
    setUser(decoded);
    setIsLoggedIn(!!decoded);
  }, []);

  if (!isMounted) return null;

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
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "profile" && isLoggedIn && (
            <ProfileSettings user={user} />
          )}
          {activeTab === "security" && isLoggedIn && (
            <SecuritySettings user={user} />
          )}
        </Card>
        <Card className="w-1/3 max-h-fit flex flex-col gap-2 p-4">
          {isLoggedIn && (
            <>
              <Button
                variant={activeTab === "profile" ? "default" : "outline"}
                className="w-full justify-center md:justify-start"
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "outline"}
                className="w-full justify-center md:justify-start"
                onClick={() => setActiveTab("security")}
              >
                Security
              </Button>
            </>
          )}
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
