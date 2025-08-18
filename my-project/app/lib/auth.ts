export interface JWTPayload {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // keep this!
  iat?: number;
  exp?: number;
}