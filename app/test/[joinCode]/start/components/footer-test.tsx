import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  BookmarkIcon,
  ListIcon,
} from "lucide-react";

export default function FooterTest({
  handlePrev,
  handleMark,
  handleNext,
}: {
  handlePrev: () => void;
  handleMark: () => void;
  handleNext: () => void;
}) {
  return (
    <footer className="fixed bottom-0 left-0 z-10 h-16 w-full flex justify-between items-center p-4 text-center bg-card text-foreground">
      <Button onClick={handlePrev}>
        <ChevronLeft />
      </Button>
      <div className="flex items-center justify-center gap-4">
        <Button variant={"secondary"} onClick={handleMark}>
          <BookmarkIcon />
        </Button>
        <Button variant={"secondary"}>
          <ListIcon />
        </Button>
      </div>
      <Button onClick={handleNext}>
        <ChevronRight />
      </Button>
    </footer>
  );
}
