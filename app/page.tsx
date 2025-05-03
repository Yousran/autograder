//TODO: QR code scanner & Generator
//TODO: Update Text Editor, using shadcn ContextMenu
//TODO: Essay Grader using Score and Score explanation
//TODO: Multiple choice Refactor
//TODO: question type icon and using shadcn hover
//TODO: Server side and client side Types Refactor
//TODO: Test optional settings when creating a test
//TODO: When participant joins the test and already have made, join the test
//TODO: Participant list on test edit update every 5 seconds
//TODO: Application icon
//TODO: Comments and Feedback
//TODO: Tutorials and help
//TODO: Middleware for pages
"use client";
import { useState } from "react";
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
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState<string>("");

  const handleJoin = () => {
    if (joinCode.length === 6) {
      router.push(`/test/${joinCode}`);
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
            <Button onClick={handleJoin}>Join</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
