//TODO: login
//TODO: logout
//TODO: auth ui
//TODO: api auth middleware
//TODO: create test
//TODO: profile page
//TODO: show created test
//TODO: edit title, edit settings

//TODO: join test
//TODO: working test
//TODO: test result
//TODO: edit test result
//TODO: share join code and QR code
//TODO: create choice question,set true first choice by default
//TODO: settings true by default
//TODO: is_ordered and unordered
//TODO: optional test duration using alarm input
//TODO: edit profile
//TODO: login with google
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

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
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl">
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
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="default"
                className="w-full"
                onClick={handleJoin}
                disabled={joinCode.length !== 6}
              >
                Join
              </Button>
              <Button variant="secondary" className="w-fit">
                <i className="bx bx-scan text-lg"></i>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
