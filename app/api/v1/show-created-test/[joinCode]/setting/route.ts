import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Pastikan Anda sudah mengkonfigurasi Prisma

export async function PATCH(req: Request, { params }: { params: { joinCode: string } }) {
  try {
    const body = await req.json();
    const { joinCode } = params;

    // Validasi jika test dengan join_code tersebut ada
    const existingTest = await prisma.test.findUnique({
      where: { join_code: joinCode },
    });

    if (!existingTest) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Pastikan hanya field yang diizinkan yang bisa diperbarui
    const allowedFields = ["accept_responses", "show_detailed_score", "is_ordered"];
    const updateData: Record<string, boolean> = {};

    for (const key in body) {
      if (allowedFields.includes(key) && typeof body[key] === "boolean") {
        updateData[key] = body[key];
      }
    }

    // Jika tidak ada field valid yang di-update, kembalikan respons error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Invalid update fields" }, { status: 400 });
    }

    // Update pengaturan di database
    const updatedTest = await prisma.test.update({
      where: { join_code: joinCode },
      data: updateData,
    });

    return NextResponse.json(updatedTest, { status: 200 });
  } catch (error) {
    console.error("Error updating test settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
