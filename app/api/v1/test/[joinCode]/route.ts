import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  // const { joinCode } = await params;
  const { GET } = await import("./get");
  return GET(req, { params });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ joinCode: string }> }
) {
  // const { joinCode } = await params;
  const { PATCH } = await import("./patch");
  return PATCH(req, { params });
}
