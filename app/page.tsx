// app/page.tsx
// TODO: unique participant username test
// TODO: Detailed Score for test creator
// TODO: Detailed Score for participant
// TODO: English language for all ui
// TODO: Add QR Code Feature

"use client";

import Navbar from "@/components/custom/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const handleJoin = () => {
    if (joinCode.length === 6) {
      router.push(`/test/${joinCode}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen pt-16">
        <Card className="w-fit shadow-lg rounded-2xl">
          <CardContent className="flex flex-col gap-6 p-6">
            <h2 className="text-xl font-semibold text-center">Enter Join Code</h2>
            <div className="w-full flex justify-center">
              <InputOTP
                maxLength={6}
                className="flex justify-center"
                value={joinCode}
                onChange={(value) => setJoinCode(value.toUpperCase())} // Pastikan huruf kapital
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
            <div className="flex w-full gap-4">
              <Button
                variant="default"
                className="w-full"
                onClick={handleJoin}
                disabled={joinCode.length !== 6}
              >
                Join
              </Button>
              {/* TODO: QR Feature */}
              {/* <Button variant="secondary" className="w-fit">
                <i className="bx bx-scan text-lg"></i>
              </Button> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}