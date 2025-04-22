//file: app/test/[joinCode]/start/components/footer-test.tsx
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  BookmarkIcon,
  ListIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function FooterTest({
  handlePrev,
  handleMark,
  handleNext,
  isLastQuestion,
  isLoading,
  handleFinish,
  handleEndTest,
}: {
  handlePrev: () => void;
  handleMark: () => void;
  handleNext: () => void;
  isLastQuestion: boolean;
  isLoading: boolean;
  handleFinish: () => void;
  handleEndTest: () => void;
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
      {isLastQuestion ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" onClick={handleFinish}>
              Finish
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Test?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to finish the test? You wont be able to
                change your answers afterwards.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEndTest} disabled={isLoading}>
                {isLoading ? "Loading..." : "Finish Test"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button onClick={handleNext}>
          <ChevronRight />
        </Button>
      )}
    </footer>
  );
}
