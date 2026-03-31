import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ParticipantCardSkeleton() {
  return (
    <Card className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
    </Card>
  );
}
