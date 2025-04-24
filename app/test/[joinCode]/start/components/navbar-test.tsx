import { Label } from "@/components/ui/label";
import { Participant, Test } from "../participant-response";
import CountdownTimer from "./countdown-timer";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export default function NavbarTest({
  participant,
  test,
  handleFinish,
  endTest,
}: {
  participant: Participant | null;
  test: Test | null;
  handleFinish: () => Promise<void>;
  endTest: () => Promise<void>;
}) {
  return (
    <nav className="fixed top-0 left-0 z-10 h-16 w-full flex items-center justify-between p-4 shadow-sm bg-card text-foreground">
      {participant && test && (
        <>
          <Label className="text-2xl font-bold">{participant.username}</Label>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <CountdownTimer
              startTime={participant.createdAt}
              durationMinutes={test.testDuration}
              handleFinish={async () => await handleFinish()}
              endTest={async () => await endTest()}
            />
          </div>
        </>
      )}
    </nav>
  );
}
