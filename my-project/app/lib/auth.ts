

import { SignJWT, jwtVerify } from "jose";

// Hardcoded secret for JWT signing and verification
const JWT_SECRET = new TextEncoder().encode("hardcoded_super_secret_key_change_me");

export type AuthPayload = {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

// Create a JWT for a user
export async function createToken(payload: AuthPayload): Promise<string> {
  return await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

// Verify a JWT and return the payload, or null if invalid
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Type guard: ensure all required fields exist
    if (
      typeof payload.userId === "number" &&
      typeof payload.email === "string" &&
      typeof payload.firstName === "string" &&
      typeof payload.lastName === "string" &&
      typeof payload.role === "string"
    ) {
      return payload as AuthPayload;
    }
    return null;
  } catch (error) {
    // Log specific JWT error for debugging
    if (error instanceof Error) {
      console.error("JWT verification failed:", error.message);
    }
    return null;
  }
}

// Extract Bearer token from a Request
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// Check if a JWT is expired (returns true if expired or invalid)
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return typeof payload.exp !== "number" || payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}