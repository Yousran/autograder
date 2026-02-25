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
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import Navbar from "@/components/custom/navbar";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const t = useTranslations("Home");
  const [code, setCode] = useState("");
  const { data: session } = authClient.useSession();

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
              <InputOTP maxLength={6} value={code} onChange={setCode}>
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
                <Button className="flex-1">{t("join")}</Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
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
                <Button asChild className="w-full">
                  <Link href="/test/create">{t("createTest")}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
