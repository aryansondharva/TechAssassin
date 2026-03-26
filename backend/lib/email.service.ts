/**
 * Email Service - Backend
 * 
 * Handles email operations using Resend API for OTP and notifications
 */

import nodemailer from 'nodemailer';

// Initialize SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email configuration
const FROM_EMAIL = process.env.SMTP_USER || 'noreply@techassassin.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Tech Assassin';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6');

// Email types
interface SendOTPData {
  email: string;
  otp: string;
  purpose: 'password_reset' | 'email_verification' | 'login_verification';
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Generate 6-digit OTP
   */
  static generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Send OTP email
   */
  static async sendOTP(data: SendOTPData): Promise<void> {
    const { email, otp, purpose } = data;
    
    const emailContent = this.formatOTPEmail(otp, purpose);
    
    try {
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      
      console.log(`OTP sent to ${email} for ${purpose} via SMTP`);
    } catch (error) {
      console.error('Failed to send OTP email via SMTP:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  /**
   * Send custom email
   */
  static async sendEmail(data: EmailData): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      });
      
      console.log(`Email sent to ${data.to} via SMTP`);
    } catch (error) {
      console.error('Failed to send email via SMTP:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Format OTP email template
   */
  static formatOTPEmail(otp: string, purpose: string): { subject: string; html: string } {
    const subject = this.getSubject(purpose);
    const html = this.getOTPEmailHTML(otp, purpose);
    
    return { subject, html };
  }

  /**
   * Get email subject based on purpose
   */
  private static getSubject(purpose: string): string {
    switch (purpose) {
      case 'password_reset':
        return 'TechAssassin - Password Reset OTP';
      case 'login_verification':
        return 'TechAssassin - Login Verification OTP';
      case 'email_verification':
        return 'TechAssassin - Email Verification OTP';
      default:
        return 'TechAssassin - Verification OTP';
    }
  }

  /**
   * Generate HTML email template for OTP
   */
  private static getOTPEmailHTML(otp: string, purpose: string): string {
    const purposeText = this.getPurposeText(purpose);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TechAssassin - OTP Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #2563eb, #f59e0b);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
            margin: 0 auto;
          }
          .title {
            color: #2563eb;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .otp-container {
            background-color: #f8fafc;
            border: 2px dashed #2563eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #2563eb;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .expiry {
            color: #64748b;
            font-size: 14px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          .security-note {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .purpose-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">TA</div>
            <div class="title">
              Tech<span style="color: #f59e0b;">Assassin</span>
            </div>
            <div class="subtitle">${purposeText}</div>
          </div>

          <div class="purpose-icon">
            ${this.getPurposeIcon(purpose)}
          </div>

          <div class="otp-container">
            <p style="margin-bottom: 10px; font-weight: 600;">Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p class="expiry">This code will expire in ${OTP_EXPIRY_MINUTES} minutes</p>
          </div>

          <div class="security-note">
            <strong>🔒 Security Notice:</strong> Never share this code with anyone. Our team will never ask for your OTP via phone or email.
          </div>

          <p>If you didn't request this code, please ignore this email or contact our support team immediately.</p>

          <div class="footer">
            <p>&copy; 2025 TechAssassin. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p>Need help? Contact us at support@techassassin.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get purpose text for email
   */
  private static getPurposeText(purpose: string): string {
    switch (purpose) {
      case 'password_reset':
        return 'Reset your password';
      case 'login_verification':
        return 'Verify your login';
      case 'email_verification':
        return 'Verify your email address';
      default:
        return 'Verify your account';
    }
  }

  /**
   * Get purpose icon for email
   */
  private static getPurposeIcon(purpose: string): string {
    switch (purpose) {
      case 'password_reset':
        return '🔐';
      case 'login_verification':
        return '👤';
      case 'email_verification':
        return '✉️';
      default:
        return '🔒';
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email provider for analytics
   */
  static getEmailProvider(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return 'unknown';
    
    if (domain.includes('gmail')) return 'gmail';
    if (domain.includes('yahoo')) return 'yahoo';
    if (domain.includes('outlook') || domain.includes('hotmail')) return 'outlook';
    if (domain.includes('protonmail')) return 'protonmail';
    if (domain.includes('icloud')) return 'icloud';
    
    return 'other';
  }

  /**
   * Test email configuration
   */
  static async testEmail(): Promise<boolean> {
    try {
      const testOTP = this.generateOTP();
      await this.sendOTP({
        email: 'test@example.com',
        otp: testOTP,
        purpose: 'email_verification'
      });
      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}

export default EmailService;
