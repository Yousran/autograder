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
import { getToken } from "@/lib/auth-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TestSettings } from "../../create/components/test-settings";
import { TestFormValues } from "../../create/page";
import Participants from "./components/participants";
import { Skeleton } from "@/components/ui/skeleton";
import Questions from "./components/questions";
import { Button } from "@/components/ui/button";
import { CopyIcon, QrCodeIcon } from "lucide-react";
import { devLog } from "@/utils/devLog";
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";

export default function TestEditPage() {
  const { joinCode } = useParams<{ joinCode: string }>();
  const [test, setTest] = useState<TestFormValues | null>(null);
  const [activeTab, setActiveTab] = useState("settings");

  const fetchTest = async (joinCode: string) => {
    const token = getToken();
    const res = await fetch(`/api/v1/test/${joinCode}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      toast.error("Error fetching test data");
      return;
    }
    const data = await res.json();
    setTest(data);
    devLog("Test data:", data);
  };

  const updateTestField = async (key: string, value: unknown) => {
    if (!test) return;
    const token = getToken();

    const res = await fetch(`/api/v1/test/${joinCode}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
      }),
    });

    devLog("Update response:", res);

    if (!res.ok) {
      toast.error(`Failed to update ${key}`);
    }
  };

  useEffect(() => {
    fetchTest(joinCode);
  }, [joinCode]);

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex justify-center items-start p-4">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {test ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-center">
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
                        <QRCode
                          value={`${process.env.SITE_URL}/test/${joinCode}`}
                        />
                      </div>
                      <DialogDescription>{joinCode}</DialogDescription>
                    </DialogContent>
                  </Dialog>

                  <p className="w-full text-5xl text-center font-bold font-sans">
                    {joinCode}
                  </p>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(joinCode);
                      toast.success("Join code copied!");
                    }}
                  >
                    <CopyIcon className="w-5 h-5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
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
              {test ? (
                <TestSettings
                  test={test}
                  setTest={setTest}
                  onUpdateField={updateTestField}
                />
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </TabsContent>
            <TabsContent value="questions">
              {activeTab === "questions" && <Questions joinCode={joinCode} />}
            </TabsContent>
            <TabsContent value="participants">
              {activeTab === "participants" && (
                <Participants joinCode={joinCode} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
