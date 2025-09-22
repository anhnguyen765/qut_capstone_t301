import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/app/lib/email";

// Test email service functionality
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, testType = 'connection' } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    let result;

    switch (testType) {
      case 'connection':
        result = await emailService.testConnection();
        break;
      case 'email':
        result = await emailService.sendTestEmail(to);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid test type. Use 'connection' or 'email'" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      message: testType === 'connection' 
        ? (result.success ? 'SMTP connection successful' : 'SMTP connection failed')
        : (result.success ? 'Test email sent successfully' : 'Test email failed'),
      error: result.error,
      configuration: emailService.getConfiguration()
    });

  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      { error: "Failed to test email service" },
      { status: 500 }
    );
  }
}

// Get email service status
export async function GET() {
  try {
    const status = emailService.getStatus();

    return NextResponse.json({
      ...status,
      message: status.isReady 
        ? '✅ Email service is ready and operational' 
        : `❌ Email service is not ready: ${status.error || 'Unknown error'}`,
      troubleshooting: status.error ? {
        error: status.error,
        suggestions: [
          'Check SMTP credentials in environment variables',
          'For Gmail, use App Password instead of regular password',
          'Ensure 2-factor authentication is enabled for Gmail',
          'Verify SMTP host and port settings',
          'Check firewall/network settings allow SMTP connections'
        ]
      } : null
    });

  } catch (error) {
    console.error("Get email status error:", error);
    return NextResponse.json(
      { error: "Failed to get email service status" },
      { status: 500 }
    );
  }
}
