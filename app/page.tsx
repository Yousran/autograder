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

export default function Home() {
  const [joinCode, setJoinCode] = useState<string>("");
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
            <Button>Join</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
