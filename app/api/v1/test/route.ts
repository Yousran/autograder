import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { POST } = await import("./post");
  return POST(req);
}
