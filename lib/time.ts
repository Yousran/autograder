export function calculateEndTime(startTime: string, durationMinutes: number) {
  const start = new Date(startTime).getTime();
  return start + durationMinutes * 60 * 1000;
}

export function getTimeLeft(endTime: number) {
  const now = Date.now();
  return Math.max(endTime - now, 0);
}

export function formatTime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
