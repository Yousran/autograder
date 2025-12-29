import { prisma } from "@/lib/prisma";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BASE = CHARS.length;
const CODE_LENGTH = 6;
const MAX_ID = Math.pow(BASE, CODE_LENGTH) - 1; // 729,000,000 - 1

function feistelRound(value: number, roundKey: number): number {
  return ((value ^ roundKey) + 0xabcd) & 0x7fff;
}

function feistelEncrypt30(id: number, keys: number[]): number {
  let left = (id >> 15) & 0x7fff;
  let right = id & 0x7fff;

  for (const key of keys) {
    const temp = left ^ feistelRound(right, key);
    left = right;
    right = temp;
  }

  return (left << 15) | right;
}

export function encodeJoinCodeFromNumber(input: number): string {
  const id = input % (MAX_ID + 1); // pastikan dalam batas

  const secretKey = [0x1234, 0x5678, 0x9abc];
  const encryptedId = feistelEncrypt30(id, secretKey);

  let code = "";
  let current = encryptedId;

  for (let i = 0; i < CODE_LENGTH; i++) {
    code = CHARS[current % BASE] + code;
    current = Math.floor(current / BASE);
  }

  return code;
}

// Generate a unique join code with collision retry
export async function generateUniqueJoinCode(maxRetries = 10): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Use current timestamp + random to generate a unique seed
    const seed = Date.now() + Math.floor(Math.random() * 1_000_000);
    const joinCode = encodeJoinCodeFromNumber(seed);

    // Check if this code already exists
    const existing = await prisma.test.findUnique({
      where: { joinCode },
      select: { id: true },
    });

    if (!existing) {
      return joinCode;
    }
  }
  throw new Error("Failed to generate unique join code after max retries");
}
