import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { joinCode: string } }
) {
  const { joinCode } = params;
  const { GET } = await import("./get");
  return GET(req, { params: { joinCode } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { joinCode: string } }
) {
  const { joinCode } = params;
  const { PATCH } = await import("./patch");
  return PATCH(req, { params: { joinCode } });
}
