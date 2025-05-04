//TODO: Multiple choice Refactor
//TODO: Server side and client side Types Refactor
//TODO: question type icon and using shadcn hover
//TODO: Test optional settings when creating a test
//TODO: When participant joins the test and already have made, join the test
//TODO: Participant list on test edit update every 5 seconds
//TODO: Application icon
//TODO: Comments and Feedback
//TODO: Tutorials and help
//TODO: Image Upload and video Insert
//TODO: Middleware for pages
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScanQrCodeIcon } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState<string>("");
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState(false);

  const handleJoin = () => {
    if (joinCode.length === 6) {
      router.push(`/test/${joinCode}`);
    }
  };

  const handleScan = (codes: { rawValue: string }[]) => {
    const code = codes[0]?.rawValue;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!code || !siteUrl) return;

    try {
      const url = new URL(code);

      const isSameOrigin = url.origin === siteUrl;
      const isTestPath = /^\/test\/[a-zA-Z0-9_-]+$/.test(url.pathname);

      if (isSameOrigin && isTestPath) {
        window.location.href = code;
        setScannerOpen(false);
      } else {
        toast.error("QR code are not valid.");
      }
    } catch {
      toast.error("QR code are not valid.");
    }
  };

  return (
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex justify-center items-center">
        <Card className="w-fit h-full flex items-center justify-center">
          <CardContent className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-center">
              Enter Join Code
            </h2>
            <div className="w-full flex justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                inputMode="text"
                className="flex justify-center"
                value={joinCode}
                onChange={(value) => setJoinCode(value.toUpperCase())}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={handleJoin} className="flex-1">
                Join
              </Button>
              <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ScanQrCodeIcon className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogTitle className="hidden" />
                  <div className="w-full p-4">
                    {cameraError ? (
                      <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Camera cannot be accessed. Make sure camera
                          permissions are granted through the browser settings.
                          And then reload the page.
                        </p>
                      </div>
                    ) : (
                      <Scanner
                        onScan={handleScan}
                        onError={() => setCameraError(true)}
                        formats={["qr_code"]}
                        components={{ finder: false }}
                        classNames={{ container: "rounded-xl" }}
                      />
                    )}
                  </div>
                  <DialogDescription className="hidden" />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
