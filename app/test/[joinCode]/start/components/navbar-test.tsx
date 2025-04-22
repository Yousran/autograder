import { Label } from "@/components/ui/label";
import { Participant, Test } from "../participant-response";

export default function NavbarTest({
  participant,
  test,
}: {
  participant: Participant | null;
  test: Test | null;
}) {
  return (
    <nav className="fixed top-0 left-0 z-10 h-16 w-full flex items-center justify-between p-4 shadow-sm bg-card text-foreground">
      <Label className="text-2xl font-bold">{participant?.username}</Label>
      <Label className="text-2xl font-bold">{test?.testDuration}</Label>
    </nav>
  );
}
