import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: { joinCode: string } }
) {
  const { joinCode } = context.params;
  const { GET } = await import("./get");
  return GET(req, { params: { joinCode } });
}

export async function PATCH(
  req: NextRequest,
  context: { params: { joinCode: string } }
) {
  const { joinCode } = context.params;
  const { PATCH } = await import("./patch");
  return PATCH(req, { params: { joinCode } });
}
