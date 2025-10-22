import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import bcrypt from "bcryptjs";

interface PasswordResetToken {
  id: number;
  user_id: number;
  email: string;
  token: string;
  expires_at: Date;
  used: boolean;
}

interface User {
  id: number;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate token format (should be 64 character hex string)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Find valid, unused token - use explicit UTC comparison
    const tokens = await executeQuery(
      `SELECT pr.id, pr.user_id, pr.email, pr.token, pr.expires_at, pr.used
       FROM password_resets pr
       WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > UTC_TIMESTAMP()`,
      [token]
    ) as PasswordResetToken[];

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const resetToken = tokens[0];

    // Verify the user is still an admin
    const users = await executeQuery(
      "SELECT id, role FROM users WHERE id = ? AND role = 'admin'",
      [resetToken.user_id]
    ) as User[];

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "User not found or not authorized for password reset" },
        { status: 403 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and mark token as used
    await executeQuery(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, resetToken.user_id]
    );

    // Mark token as used
    await executeQuery(
      `UPDATE password_resets SET used = TRUE WHERE id = ?`,
      [resetToken.id]
    );

    // Clean up old/expired tokens for this user
    await executeQuery(
      `DELETE FROM password_resets WHERE user_id = ? AND (used = TRUE OR expires_at < NOW())`,
      [resetToken.user_id]
    );

    console.log(`Admin password reset successful for user ID: ${resetToken.user_id}`);

    return NextResponse.json({
      message: "Password reset successful. You can now log in with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}