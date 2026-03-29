"use client";

import { useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Pipette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PRESETS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#1e293b",
];

function isValidHex(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export function ColorPicker({
  value,
  onChange,
  onClear,
  className,
  children,
}: {
  value: string;
  onChange: (hex: string) => void;
  /** Called when the user clears the color, reverting to the theme default. */
  onClear?: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const [inputValue, setInputValue] = useState(isValidHex(value) ? value : "");

  const handlePickerChange = useCallback(
    (hex: string) => {
      setInputValue(hex);
      onChange(hex);
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const normalised = raw.startsWith("#") ? raw : `#${raw}`;
    if (isValidHex(normalised)) {
      onChange(normalised);
    }
  };

  const handleInputBlur = () => {
    // If value is empty (cleared), show placeholder; otherwise restore valid hex
    setInputValue(isValidHex(value) ? value : "");
  };

  const displayColor = isValidHex(value) ? value : null;
  const isDefault = !displayColor;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "flex items-center gap-2 font-mono text-sm",
              className,
            )}
          >
            <span
              className={cn(
                "size-4 shrink-0 rounded-sm border border-black/10",
                isDefault && "bg-foreground",
              )}
              style={
                displayColor ? { backgroundColor: displayColor } : undefined
              }
            />
            {value || "default"}
            <Pipette className="ml-auto size-3.5 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3" align="start">
        <HexColorPicker
          color={displayColor ?? "#000000"}
          onChange={handlePickerChange}
          style={{ width: "100%", height: "160px" }}
        />

        {/* Hex input */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "size-6 shrink-0 rounded-sm border border-black/10",
              isDefault && "bg-foreground",
            )}
            style={displayColor ? { backgroundColor: displayColor } : undefined}
          />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="#000000"
            className="h-8 font-mono text-xs"
            maxLength={7}
          />
          {onClear && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              title="Reset to default"
              onClick={() => {
                setInputValue("");
                onClear();
              }}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Presets */}
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Preset
          </p>
          <div className="flex flex-wrap gap-1.5">
            {/* Default / clear swatch */}
            {onClear && (
              <button
                type="button"
                title="Default (clear)"
                onClick={() => {
                  setInputValue("");
                  onClear();
                }}
                className={cn(
                  "size-6 rounded-sm border-2 bg-foreground transition-transform hover:scale-110",
                  isDefault
                    ? "border-foreground ring-2 ring-ring ring-offset-1"
                    : "border-transparent",
                )}
              />
            )}
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                title={preset}
                onClick={() => handlePickerChange(preset)}
                className={cn(
                  "size-6 rounded-sm border-2 transition-transform hover:scale-110",
                  value === preset ? "border-foreground" : "border-transparent",
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
