// lib/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Fungsi untuk sign JWT
export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Fungsi untuk verifikasi JWT
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
  } catch (err) {
    console.error("JWT verification error:", err);
    return null;
  }
}
