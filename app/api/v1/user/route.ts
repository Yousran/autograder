import { NextRequest } from "next/server";

// export async function GET(req: NextRequest, context: any) {
//   const { GET } = await import('./get')
//   return GET(req, context)
// }

export async function PATCH(req: NextRequest) {
  const { PATCH } = await import("./patch");
  return PATCH(req);
}

// export async function DELETE(req: NextRequest, context: any) {
//   const { DELETE } = await import('./delete')
//   return DELETE(req, context)
// }
