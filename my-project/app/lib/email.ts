import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
  recipients?: string[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;
  private isInitialized = false;
  private initializationError: string | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Enhanced SMTP configuration with fallbacks
      this.config = {
        host: process.env.SMTP_HOST || 'mail.yourdomain.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER || 'noreply@yourdomain.com',
          pass: process.env.SMTP_PASS || ''
        }
      };

      // Validate configuration
      if (!this.config.auth.pass) {
        const errorMsg = 'SMTP password is required. Please set SMTP_PASS environment variable.';
        this.initializationError = errorMsg;
        throw new Error(errorMsg);
      }

      if (!this.config.auth.user || this.config.auth.user === 'noreply@yourdomain.com') {
        const errorMsg = 'SMTP user is required. Please set SMTP_USER environment variable.';
        this.initializationError = errorMsg;
        throw new Error(errorMsg);
      }

      console.log('Attempting to initialize SMTP transporter...');
      console.log(`SMTP Host: ${this.config.host}`);
      console.log(`SMTP Port: ${this.config.port}`);
      console.log(`SMTP User: ${this.config.auth.user}`);
      console.log(`SMTP Secure: ${this.config.secure}`);

      this.transporter = nodemailer.createTransport(this.config);
      
      // Verify connection with timeout
      console.log('Verifying SMTP connection...');
      await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP verification timeout after 10 seconds')), 10000)
        )
      ]);
      
      this.isInitialized = true;
      this.initializationError = null;
      console.log('SMTP connection established successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationError = errorMessage;
      this.transporter = null;
      this.isInitialized = false;
      
      console.error('Failed to initialize SMTP transporter:');
      console.error(`Error: ${errorMessage}`);
      
      if (error instanceof Error && error.code) {
        console.error(`Error Code: ${error.code}`);
      }
      
      if (error instanceof Error && error.response) {
        console.error(`SMTP Response: ${error.response}`);
      }

      // Log troubleshooting information
      console.log('\nRequired Environment Variables:');
      console.log('- SMTP_HOST: Your SMTP server hostname');
      console.log('- SMTP_PORT: SMTP port (usually 587 or 465)');
      console.log('- SMTP_USER: Your email address');
      console.log('- SMTP_PASS: Your email password or app password');
      console.log('- SMTP_SECURE: true for port 465, false for port 587');
    }
  }

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    // Check if SMTP transporter failed to initialize
    if (!this.transporter || !this.isInitialized) {
      const errorMsg = this.initializationError || 'SMTP transporter not initialized';
      console.error('Cannot send email - SMTP transporter not available:');
      console.error(`Error: ${errorMsg}`);
      return { 
        success: false, 
        error: `SMTP Transport Failed: ${errorMsg}` 
      };
    }

    try {
      // Normalize recipients to array
      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
      
      console.log(`Attempting to send email to: ${recipients.join(', ')}`);
      console.log(`Subject: ${emailData.subject}`);
      
      const mailOptions = {
        from: emailData.from || this.config?.auth.user,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
        headers: {
          'X-Mailer': 'CRM Email System',
          'X-Priority': '3'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully to: ${recipients.join(', ')}`);
      console.log(`Message ID: ${result.messageId}`);
      
      return { 
        success: true, 
        messageId: result.messageId,
        response: `Message sent: ${result.messageId}`,
        recipients: recipients
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Email sending failed:');
      console.error(`Error: ${errorMessage}`);
      
      if (error instanceof Error && error.code) {
        console.error(`Error Code: ${error.code}`);
      }
      
      if (error instanceof Error && error.response) {
        console.error(`SMTP Response: ${error.response}`);
      }

      // Log detailed error information
      console.log('\n🔍 Email Send Error Details:');
      console.log(`Recipients: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`From: ${emailData.from || this.config?.auth.user}`);
      
      return { 
        success: false, 
        error: `Email Send Failed: ${errorMessage}` 
      };
    }
  }

  async sendBulkEmails(emails: EmailData[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const emailData of emails) {
      const result = await this.sendEmail(emailData);
      results.push(result);
      
      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter || !this.isInitialized) {
      return { success: false, error: 'SMTP transporter not initialized' };
    }

    try {
      await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP verification timeout')), 10000)
        )
      ]);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('SMTP connection test failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async sendTestEmail(to: string): Promise<EmailResult> {
    const testEmailData: EmailData = {
      to: to,
      subject: 'Test Email from CRM System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email from your CRM system.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>SMTP Host:</strong> ${this.config?.host}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent to verify your SMTP configuration.
          </p>
        </div>
      `,
      text: `Test Email\n\nThis is a test email from your CRM system.\nTimestamp: ${new Date().toISOString()}\nSMTP Host: ${this.config?.host}`
    };

    return await this.sendEmail(testEmailData);
  }

  getConfiguration(): { host: string; port: number; secure: boolean; user: string } | null {
    if (!this.config) return null;
    
    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      user: this.config.auth.user
    };
  }

  isReady(): boolean {
    return this.isInitialized && this.transporter !== null;
  }

  getInitializationError(): string | null {
    return this.initializationError;
  }

  getStatus(): {
    isReady: boolean;
    isInitialized: boolean;
    hasTransporter: boolean;
    error: string | null;
    config: { host: string; port: number; secure: boolean; user: string } | null;
  } {
    return {
      isReady: this.isReady(),
      isInitialized: this.isInitialized,
      hasTransporter: this.transporter !== null,
      error: this.initializationError,
      config: this.getConfiguration()
    };
  }
}

export const emailService = new EmailService();
