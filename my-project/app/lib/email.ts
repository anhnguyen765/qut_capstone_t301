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
        throw new Error('SMTP password is required');
      }

      this.transporter = nodemailer.createTransporter(this.config);
      
      // Verify connection with timeout
      await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP verification timeout')), 10000)
        )
      ]);
      
      this.isInitialized = true;
      console.log('SMTP connection established successfully');
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
      this.transporter = null;
      this.isInitialized = false;
    }
  }

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    if (!this.transporter || !this.isInitialized) {
      return { success: false, error: 'SMTP transporter not initialized' };
    }

    try {
      // Normalize recipients to array
      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
      
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
      
      return { 
        success: true, 
        messageId: result.messageId,
        response: `Message sent: ${result.messageId}`,
        recipients: recipients
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
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
}

export const emailService = new EmailService();
