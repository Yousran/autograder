import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface ScoreProgressProps {
  score: number | null;
  maxScore: number;
}

export default function ScoreProgress({ score, maxScore }: ScoreProgressProps) {
  const currentScore = score ?? 0;
  const percentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-lg font-bold">Score</Label>
      <Progress value={percentage} />
      <Label className="text-sm font-normal text-primary">
        {currentScore}/{maxScore}
      </Label>
    </div>
  );
}
