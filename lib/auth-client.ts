import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "@/types/token";

export function getDecodedToken(): DecodedToken | null {
  const token = Cookies.get("token");
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
