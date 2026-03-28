//TODO: uniform test naming, structure and organization in the tests folder
//TODO: question reordering e2e tests using playwright
//TODO: ai grading and feedback generation using openrouter as default but with model provider selection support
//TODO: dont load the choices separately for each question, but load them in bulk with the questions to avoid multiple requests and reordering issues
//TODO: reordering issues where the question text and type related data goes missing when displaced in the list
//TODO: nextstepjs tour component for onboarding
//TODO: scroll to top button on question editing page
//TODO: scroll to newly created question
//TODO: e2e tests using playwright
//TODO: make sure to use next-intl for all text content and add missing translations
//TODO: add comments to all functions and components
//TODO: make sure to use centralized types for API routes and form validation
//TODO: on field error display instead of just showing a toast
//TODO: theme changer support
//TODO: permit io for ReBAC support
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
  const t = useTranslations("Pages.home");
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
                {t("enterJoinCode")}
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
                  {isJoining ? <Spinner /> : t("join")}
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
                      <p>{t("scanQrCode")}</p>
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
                <span className="text-xs text-muted-foreground">{t("or")}</span>
                <Separator className="flex-1" />
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-semibold">
                  {t("createTestHeading")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("createTestDescription")}
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
