import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/lib/db";
import { emailService } from "@/app/lib/email";
import crypto from "crypto";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

// Rate limiting map (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(email);
  
  if (!limit) {
    rateLimitMap.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 minutes
    return true;
  }
  
  if (now > limit.resetTime) {
    rateLimitMap.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }
  
  if (limit.count >= 3) { // Max 3 requests per 15 minutes
    return false;
  }
  
  limit.count++;
  return true;
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

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // Check if user exists and is an admin
    const users = await executeQuery(
      "SELECT id, first_name, last_name, email, role FROM users WHERE email = ? AND role = 'admin'",
      [email]
    ) as User[];

    // Always return success message to prevent email enumeration
    const successMessage = "If this email belongs to an admin account, a password reset link has been sent.";

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ message: successMessage });
    }

    const user = users[0];

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database - use explicit UTC format to avoid timezone issues
    await executeQuery(
      `INSERT INTO password_resets (user_id, email, token, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [user.id, user.email, token, expiresAt.toISOString().slice(0, 19).replace('T', ' ')]
    );

    // Create reset URL - use APP_BASE_URL like other email links in the app
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetUrl = baseUrl.startsWith('http') 
      ? `${baseUrl}/reset-password?token=${token}` 
      : `http://${baseUrl}/reset-password?token=${token}`;

    // Send password reset email
    const emailResult = await emailService.sendEmail({
      to: user.email,
      subject: 'Admin Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #343a40; margin: 0;">Password Reset Request</h1>
            </div>
            
            <p style="color: #495057; font-size: 16px; line-height: 1.5;">
              Hello ${user.first_name} ${user.last_name},
            </p>
            
            <p style="color: #495057; font-size: 16px; line-height: 1.5;">
              You have requested to reset your admin account password. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; line-height: 1.5;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #007bff; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <div style="border-top: 1px solid #e9ecef; margin-top: 30px; padding-top: 20px;">
              <p style="color: #dc3545; font-size: 14px; margin: 0;">
                <strong>Security Notice:</strong>
              </p>
              <ul style="color: #6c757d; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>This reset is only available for admin accounts</li>
              </ul>
            </div>
            
            <p style="color: #6c757d; font-size: 12px; text-align: center; margin-top: 30px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello ${user.first_name} ${user.last_name},
        
        You have requested to reset your admin account password.
        
        Please visit the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this reset, please ignore this email.
        
        This reset is only available for admin accounts.
      `
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Don't expose email sending errors to the user
    }

    return NextResponse.json({ message: successMessage });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}