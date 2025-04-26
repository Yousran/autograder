// utils/devLog.ts
export function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("\x1b[36m%s\x1b[0m", "[DEV]", ...args);
  }
}
