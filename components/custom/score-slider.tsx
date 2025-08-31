"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ScoreSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function ScoreSlider({ value, max, onChange }: ScoreSliderProps) {
  const handleValueChange = (vals: number[]) => {
    const newValue = vals[0];
    if (newValue > max) {
      toast.warning(`Max score is ${max}`);
      onChange(max);
    } else if (newValue < 0) {
      onChange(0);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-lg font-bold">Score</Label>
      <Slider
        value={[value]}
        min={0}
        max={max}
        step={1}
        onValueChange={handleValueChange}
        className="w-full max-w-xs"
      />
      <Label className="text-muted-foreground text-sm">
        Score: {value} / {max}
      </Label>
    </div>
  );
}
