import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import { executeQuery } from "@/app/lib/db";

// Define the User type
type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Use the User type instead of any[]

    const users = await executeQuery(
      "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?",
      [payload.userId]
    ) as User[];

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }


    const user = users[0];
    // Return user object with keys matching frontend expectations
    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}