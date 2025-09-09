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
  to: string;
  subject: string;
  html: string;
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // cPanel SMTP configuration
      this.config = {
        host: process.env.SMTP_HOST || 'mail.yourdomain.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'noreply@yourdomain.com',
          pass: process.env.SMTP_PASS || ''
        }
      };

      this.transporter = nodemailer.createTransporter(this.config);
      
      // Verify connection
      await this.transporter.verify();
      console.log('SMTP connection established successfully');
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error);
      this.transporter = null;
    }
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; response?: string; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'SMTP transporter not initialized' };
    }

    try {
      const mailOptions = {
        from: emailData.from || this.config?.auth.user,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { 
        success: true, 
        response: `Message sent: ${result.messageId}` 
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
