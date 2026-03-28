/**
 * Generate initials from a name string
 * @param name - The name to generate initials from
 * @returns Initials (max 2 characters) or undefined if name is falsy
 * @example
 * getInitials("John Doe") => "JD"
 * getInitials("Alice") => "A"
 * getInitials("") => undefined
 */
export function getInitials(
  name: string | null | undefined,
): string | undefined {
  if (!name) return undefined;
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
