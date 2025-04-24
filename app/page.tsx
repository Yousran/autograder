<<<<<<< HEAD
// app/page.tsx
// TODO: Detailed Score for participant
// WIP: last question doesnt update when showing test result
// TODO: Test Join Code Using their UUID and change them into 6 digit code
// TODO: English language for all ui
// TODO: Add QR Code Feature

"use client";

import Navbar from "@/components/custom/navbar";
import { Button } from "@/components/ui/button";
=======
"use client";
import { useState } from "react";
import Navbar from "@/components/custom/navbar";
>>>>>>> baru/main
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
<<<<<<< HEAD
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
=======
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState<string>("");
>>>>>>> baru/main

  const handleJoin = () => {
    if (joinCode.length === 6) {
      router.push(`/test/${joinCode}`);
    }
  };

  return (
<<<<<<< HEAD
    <>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen pt-16">
        <Card className="w-fit shadow-lg rounded-2xl">
          <CardContent className="flex flex-col gap-6 p-6">
            <h2 className="text-xl font-semibold text-center">Enter Join Code</h2>
=======
    <div className="max-w-screen min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex justify-center items-center">
        <Card className="w-fit h-full flex items-center justify-center">
          <CardContent className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-center">
              Enter Join Code
            </h2>
>>>>>>> baru/main
            <div className="w-full flex justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                className="flex justify-center"
                value={joinCode}
<<<<<<< HEAD
                onChange={(value) => setJoinCode(value.toUpperCase())} // Pastikan huruf kapital
=======
                onChange={(value) => setJoinCode(value.toUpperCase())}
>>>>>>> baru/main
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
<<<<<<< HEAD
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
=======
            <Button onClick={handleJoin}>Join</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
>>>>>>> baru/main
