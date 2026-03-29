import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function QuestionCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        {/* Drag handle / number */}
        <Skeleton className="size-9 shrink-0 rounded-md" />
        {/* Type select */}
        <Skeleton className="h-9 flex-1" />
        {/* Delete button */}
        <Skeleton className="size-9 shrink-0" />
      </div>
    </Card>
  );
}

export function QuestionsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <QuestionCardSkeleton key={i} />
      ))}
    </div>
  );
}
