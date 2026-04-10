//TODO: nextstepjs tour component for onboarding
//TODO: refactor all types, interfaces, prisma types, and zod schemas
//TODO: make sure to use next-intl for all text content and add missing translations
//TODO: on field error display instead of just showing a toast
//TODO: toast error display with error codes
//TODO: predetermined random question support

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScanQrCode } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import Navbar from "@/components/custom/navbar";
import { Separator } from "@/components/ui/separator";
import { CreateTestButton } from "@/components/custom/create-test-button";
import { QrScannerDialog } from "@/components/custom/qr-scanner-dialog";
import { useRouter } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations();
  const [code, setCode] = useState("");
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleJoin = () => {
    const trimmed = code.trim();
    if (trimmed.length === 6) {
      setIsJoining(true);
      router.push(`/join/${trimmed}`);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <Card className="w-fit">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                {t("Pages.home.enterJoinCode")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                data-testid="input-join-code"
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
              <div className="w-full flex items-center gap-2">
                <Button
                  className="flex-1"
                  onClick={handleJoin}
                  disabled={code.trim().length !== 6 || isJoining}
                  data-testid="btn-join-home"
                >
                  {isJoining ? <Spinner /> : t("Pages.home.join")}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsQrOpen(true)}
                      >
                        <ScanQrCode />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("Pages.home.scanQrCode")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          <QrScannerDialog open={isQrOpen} onOpenChange={setIsQrOpen} />

          {session?.user && (
            <>
              <div className="flex w-full items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {t("Pages.home.or")}
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-semibold">
                  {t("Pages.home.createTestHeading")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Pages.home.createTestDescription")}
                </p>
                <CreateTestButton className="w-full" />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
