// file: lib/auth-client.ts
"use client";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/types/token";

export function getDecodedToken(): DecodedToken | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    Cookies.remove("token");
    return null;
  }
}

export function getToken(): string | null {
  return Cookies.get("token") || null;
}
