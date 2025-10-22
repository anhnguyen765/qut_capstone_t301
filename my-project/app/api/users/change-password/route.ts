import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";

interface User {
  id: number;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify JWT token
    const secret = new TextEncoder().encode("hardcoded_super_secret_key_change_me");
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get user's current password
    const users = await executeQuery(
      "SELECT id, password FROM users WHERE id = ?",
      [payload.userId]
    ) as User[];

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = users[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await executeQuery(
      `UPDATE users 
       SET password = ?, updated_at = NOW() 
       WHERE id = ?`,
      [hashedNewPassword, payload.userId]
    );

    return NextResponse.json({
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}