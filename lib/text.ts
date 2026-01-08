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

export function truncateWords(
  input: string,
  maxWordLength: number = 20
): string {
  return input
    .split(" ")
    .map((word) => {
      if (word.length > maxWordLength) {
        return word.substring(0, maxWordLength) + "...";
      }
      return word;
    })
    .join(" ");
}

export function getInitial(input?: string | null): string {
  if (input && input.length > 0) {
    return input.charAt(0).toUpperCase();
  }
  return "U";
}

export function decodeUrlParam(input: string | string[] | undefined): string {
  if (!input) return "";
  const value = Array.isArray(input) ? input[0] : input;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
