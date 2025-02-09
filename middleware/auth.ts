import jwt from "jsonwebtoken";

export function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined.");
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    
    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
