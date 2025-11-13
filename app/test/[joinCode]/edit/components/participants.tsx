import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Participant } from "@/types/participant";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function Participants({ joinCode }: { joinCode: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchParticipants() {
      try {
        const res = await fetch(`/api/v1/test/${joinCode}/participants`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch participants");
        }
        const data = await res.json();
        setParticipants(data);
      } catch (err) {
        console.error("Error fetching participants:", err);
        toast.error("Error fetching participants");
      } finally {
        setLoading(false);
      }
    }

    fetchParticipants();
  }, [joinCode]);

  return (
    <div className="flex flex-col gap-4">
      {loading && <Skeleton className="h-32 w-full" />}
      {participants.length === 0 && !loading ? (
        <div className="my-4 text-center text-primary">
          No participants available
        </div>
      ) : (
        participants.map((participant) => (
          <Card
            key={participant.id}
            onClick={() => router.push(`/participant/${participant.id}`)}
            className="cursor-pointer hover:bg-card-foreground/10 hover:scale-101 transition"
          >
            <CardContent className="flex justify-between gap-4">
              <Label className="text-xl">{participant.username}</Label>
              <Label className="text-3xl font-bold">{participant.score}</Label>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
