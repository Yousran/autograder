"use client";

import { useEffect, useState } from "react";
import { calculateEndTime, getTimeLeft, formatTime } from "@/lib/time";

interface CountdownTimerProps {
  startTime: Date;
  durationMinutes: number | null;
  handleFinish: () => Promise<void>;
  endTest: () => Promise<void>;
}

export default function CountdownTimer({
  startTime,
  durationMinutes,
  handleFinish,
  endTest,
}: CountdownTimerProps) {
  const endTime = durationMinutes
    ? calculateEndTime(startTime.toISOString(), durationMinutes)
    : null;
  const [timeLeft, setTimeLeft] = useState(endTime ? getTimeLeft(endTime) : 0);

  useEffect(() => {
    // If no duration is set, don't start the timer
    if (!endTime) return;

    const interval = setInterval(() => {
      const left = getTimeLeft(endTime);
      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(interval);

        // Wrap in async function to use await
        (async () => {
          await handleFinish();
          await endTest();
        })();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, handleFinish, endTest]);

  // If no duration is set, don't show the timer
  if (!durationMinutes || !endTime) {
    return null;
  }

  return (
    <div className="h-9 flex items-center bg-primary text-primary-foreground px-4 rounded-lg">
      <span className="font-mono font-bold text-lg">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}
