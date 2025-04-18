// lib/jwt.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwt(token: string) {
  try {
    // Dekode dan verifikasi token menggunakan JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT:", decoded);
    return decoded;
  } catch (err) {
    // Jika ada error (misal token invalid atau expired), return null
    console.error("JWT verification error:", err);
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

// Fungsi untuk mendapatkan user dari token
export function getUserFromToken(token: string) {
  try {
    // Dekode token untuk mendapatkan informasi user
    return jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      username?: string;
      iat: number;
      exp: number;
    };
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}
