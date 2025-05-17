export function truncateText(input: string): string {
  if (input.length <= 12) {
    return input;
  }
  return input.substring(0, 12) + "...";
}

export function normalizeSnakeCase(input: string): string {
  return input
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
