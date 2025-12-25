"use client"; //TODO: change to be not client because i want to add authorization where only creator can access this page
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
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getTestByJoinCode } from "@/app/actions/get-test";
import Participants from "./components/participants";
import { Skeleton } from "@/components/ui/skeleton";
import Questions from "./components/questions";
import { Button } from "@/components/ui/button";
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

export default function TestEditPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const { joinCode } = useParams<{ joinCode: string }>();
  const [activeTab, setActiveTab] = useState("settings");
  const [testId, setTestId] = useState<string>("");
  const [loadingTest, setLoadingTest] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadTest() {
      setLoadingTest(true);
      try {
        const res = await getTestByJoinCode(joinCode as string);
        if (res && "success" in res && res.success) {
          if (mounted) setTestId(res.test.id);
        } else {
          if (mounted) setTestId("");
        }
      } catch (err) {
        console.error(err);
        if (mounted) setTestId("");
      } finally {
        if (mounted) setLoadingTest(false);
      }
    }

    if (joinCode) loadTest();

    return () => {
      mounted = false;
    };
  }, [joinCode]);

  // Placeholder test data
  const test = {
    title: "Sample Test Title",
    description:
      "This is a placeholder test description. Replace with actual data from your API.",
  };

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="grow flex justify-center items-start p-4">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {test ? (
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
                        <QRCode value={`${siteUrl}/test/${joinCode}`} />
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
              <Card>
                <CardContent className="p-6">
                  <Label className="text-lg">
                    Test settings component will go here. Replace with actual
                    TestSettings component when ready.
                  </Label>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="participants">
              {activeTab === "participants" &&
                (loadingTest ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <Participants testId={testId} />
                ))}
            </TabsContent>
            <TabsContent value="questions">
              {activeTab === "questions" &&
                (loadingTest ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <Questions testId={testId} />
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
