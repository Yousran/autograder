// file: lib/auth-client.ts
"use client";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { UserDecodedToken } from "@/types/token";

export function getUserDecodedToken(): UserDecodedToken | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<UserDecodedToken>(token);
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    Cookies.remove("token");
    return null;
  }
}

export function setToken(name: string, value: string): void {
  Cookies.set(name, value, { path: "/" });
}

export function getToken(): string | null {
  return Cookies.get("token") || null;
}

export function getParticipantId(): string | null {
  return Cookies.get("participantId") || null;
}

export function removeParticipantId(): void {
  Cookies.remove("participantId");
}
