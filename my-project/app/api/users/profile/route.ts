import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { jwtVerify } from "jose";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export async function PATCH(request: NextRequest) {
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

    const { firstName, lastName, email } = await request.json();

    // Validate input
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
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

    // Check if email already exists for another user
    const existingUsers = await executeQuery(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, payload.userId]
    ) as User[];

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Update user profile
    await executeQuery(
      `UPDATE users 
       SET first_name = ?, last_name = ?, email = ?, updated_at = NOW() 
       WHERE id = ?`,
      [firstName.trim(), lastName.trim(), email.trim(), payload.userId]
    );

    // Fetch updated user data
    const updatedUsers = await executeQuery(
      "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?",
      [payload.userId]
    ) as User[];

    if (!Array.isArray(updatedUsers) || updatedUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = updatedUsers[0];

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        userId: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}