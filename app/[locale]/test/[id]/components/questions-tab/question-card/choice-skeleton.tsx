"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ChoiceSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}
