import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";

interface User {
  id: number;
  email: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists and is an admin
    const users = await executeQuery(
      "SELECT id, email, role FROM users WHERE email = ? AND role = 'admin'",
      [email]
    ) as User[];

    if (!Array.isArray(users) || users.length === 0) {
      // Return generic message to prevent email enumeration
      return NextResponse.json(
        { isAdmin: false, message: "Password reset is only available for admin users" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      message: "Admin user verified"
    });

  } catch (error) {
    console.error("Admin check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}