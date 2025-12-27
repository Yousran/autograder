"use client";

import Navbar from "@/components/custom/navbar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Participants from "./participants";
import Questions from "./questions";
import { Button } from "@/components/ui/button";
import { TestSettings } from "@/components/custom/test-settings";
import { CopyIcon, QrCodeIcon } from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Test } from "@/lib/generated/prisma/client";

export default function TestEditClient({ test }: { test: Test }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="grow flex justify-center items-start p-4">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-center overflow-ellipsis">
                {test.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {test.description && (
                  <div className="flex flex-col gap-2">
                    <Label className="text text-justify font-medium">
                      {test.description}
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center rounded-md p-4 bg-secondary">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <QrCodeIcon className="w-5 h-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md flex flex-col items-center gap-4">
                    <DialogTitle className="text-lg font-semibold">
                      Scan to join
                    </DialogTitle>
                    <div
                      style={{
                        background: "white",
                        padding: "16px",
                        borderRadius: "8px",
                      }}
                    >
                      <QRCode value={`${siteUrl}/test/${test.joinCode}`} />
                    </div>
                    <DialogDescription>{test.joinCode}</DialogDescription>
                  </DialogContent>
                </Dialog>

                <p className="w-full text-5xl text-center font-bold font-sans">
                  {test.joinCode}
                </p>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(test.joinCode);
                    toast.success("Join code copied!");
                  }}
                >
                  <CopyIcon className="w-5 h-5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
          <Tabs
            defaultValue="settings"
            onValueChange={(value) => setActiveTab(value)}
            className="w-full gap-4"
          >
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              {activeTab === "settings" && (
                <TestSettings
                // testId={test.id}
                />
              )}
            </TabsContent>
            <TabsContent value="participants">
              {activeTab === "participants" && (
                <Participants testId={test.id} />
              )}
            </TabsContent>
            <TabsContent value="questions">
              {activeTab === "questions" && <Questions testId={test.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
