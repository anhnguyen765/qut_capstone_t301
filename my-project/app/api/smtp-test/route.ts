import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';

// Test different SMTP configurations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      host, 
      port, 
      user, 
      pass, 
      secure = false,
      testEmail 
    } = body;

    if (!host || !port || !user || !pass) {
      return NextResponse.json(
        { error: "Missing required fields: host, port, user, pass" },
        { status: 400 }
      );
    }

    console.log(`Testing SMTP configuration:`);
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`User: ${user}`);
    console.log(`Secure: ${secure}`);

    // Create transporter with provided configuration
    const config = {
      host: host,
      port: parseInt(port),
      secure: secure,
      auth: {
        user: user,
        pass: pass
      }
    };

    const transporter = nodemailer.createTransport(config);

    // Test connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully!');

    // If test email provided, send test email
    if (testEmail) {
      console.log(`Sending test email to: ${testEmail}`);
      
      const testEmailData = {
        from: user,
        to: testEmail,
        subject: 'SMTP Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">SMTP Configuration Test</h2>
            <p>This email confirms that your SMTP configuration is working correctly.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>Host: ${host}</li>
              <li>Port: ${port}</li>
              <li>User: ${user}</li>
              <li>Secure: ${secure}</li>
              <li>Test Time: ${new Date().toISOString()}</li>
            </ul>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent to verify your SMTP configuration.
            </p>
          </div>
        `,
        text: `SMTP Configuration Test\n\nThis email confirms that your SMTP configuration is working correctly.\n\nConfiguration Details:\n- Host: ${host}\n- Port: ${port}\n- User: ${user}\n- Secure: ${secure}\n- Test Time: ${new Date().toISOString()}`
      };

      const result = await transporter.sendMail(testEmailData);
      console.log(`Test email sent successfully! Message ID: ${result.messageId}`);

      return NextResponse.json({
        success: true,
        message: 'SMTP configuration test successful',
        connectionVerified: true,
        testEmailSent: true,
        messageId: result.messageId,
        configuration: {
          host: host,
          port: port,
          user: user,
          secure: secure
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'SMTP connection verified successfully',
      connectionVerified: true,
      testEmailSent: false,
      configuration: {
        host: host,
        port: port,
        user: user,
        secure: secure
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SMTP configuration test failed:', errorMessage);
    
    let errorCode = '';
    let smtpResponse = '';
    
    if (error instanceof Error) {
      errorCode = (error as any).code || '';
      smtpResponse = (error as any).response || '';
    }

    // Provide specific troubleshooting based on error
    let troubleshooting = [];
    
    if (errorMessage.includes('authentication') || errorMessage.includes('535')) {
      troubleshooting = [
        'Check username and password',
        'For Gmail, use App Password instead of regular password',
        'Ensure 2-factor authentication is enabled for Gmail',
        'Verify email address is correct'
      ];
    } else if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
      troubleshooting = [
        'Check SMTP host and port',
        'Verify firewall allows SMTP connections',
        'Try different port (587 vs 465)',
        'Check if SSL/TLS setting is correct'
      ];
    } else if (errorMessage.includes('timeout')) {
      troubleshooting = [
        'Check network connection',
        'Try different SMTP server',
        'Check firewall settings',
        'Verify port is not blocked'
      ];
    } else {
      troubleshooting = [
        'Verify all SMTP settings',
        'Check email provider documentation',
        'Try alternative SMTP configuration',
        'Contact email provider support'
      ];
    }

    return NextResponse.json({
      success: false,
      message: 'SMTP configuration test failed',
      error: errorMessage,
      errorCode: errorCode,
      smtpResponse: smtpResponse,
      troubleshooting: troubleshooting,
      configuration: {
        host: body.host || '',
        port: body.port || '',
        user: body.user || '',
        secure: body.secure || false
      }
    }, { status: 400 });

  }
}

// Get common SMTP configurations for different providers
export async function GET() {
  const configurations = {
    gmail: [
      {
        name: 'Gmail (STARTTLS)',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        notes: 'Requires App Password, 2FA enabled'
      },
      {
        name: 'Gmail (SSL)',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        notes: 'Requires App Password, 2FA enabled'
      }
    ],
    outlook: [
      {
        name: 'Outlook/Hotmail',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        notes: 'Use regular password'
      }
    ],
    yahoo: [
      {
        name: 'Yahoo Mail',
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        notes: 'May require App Password'
      }
    ],
    custom: [
      {
        name: 'Custom SMTP (STARTTLS)',
        host: 'mail.yourdomain.com',
        port: 587,
        secure: false,
        notes: 'Replace with your domain'
      },
      {
        name: 'Custom SMTP (SSL)',
        host: 'mail.yourdomain.com',
        port: 465,
        secure: true,
        notes: 'Replace with your domain'
      }
    ]
  };

  return NextResponse.json({
    message: 'Common SMTP configurations',
    configurations: configurations,
    instructions: {
      gmail: [
        'Enable 2-factor authentication',
        'Generate App Password',
        'Use App Password instead of regular password'
      ],
      outlook: [
        'Use your regular email password',
        'No special configuration needed'
      ],
      yahoo: [
        'May need to enable "Less secure apps"',
        'Or generate App Password'
      ],
      custom: [
        'Contact your hosting provider',
        'Check their SMTP documentation',
        'Verify authentication requirements'
      ]
    }
  });
}

