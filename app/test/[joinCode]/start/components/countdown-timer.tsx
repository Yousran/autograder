"use client";

import { useEffect, useState } from "react";
import { calculateEndTime, getTimeLeft, formatTime } from "@/lib/time";

export default function CountdownTimer({
  startTime,
  durationMinutes,
  handleFinish,
  endTest,
}: {
  startTime: string;
  durationMinutes: number;
  handleFinish: () => Promise<void>; // kalau ini async, tambahkan Promise
  endTest: () => Promise<void>;
}) {
  const endTime = calculateEndTime(startTime, durationMinutes);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = getTimeLeft(endTime);
      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(interval);

        // Bungkus dalam fungsi async agar bisa pakai await
        (async () => {
          await handleFinish();
          await endTest();
        })();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, handleFinish, endTest]);

  return (
    <div className="h-9 flex items-center bg-primary text-primary-foreground px-4 rounded-lg">
      <span className="font-mono font-bold text-lg">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}
