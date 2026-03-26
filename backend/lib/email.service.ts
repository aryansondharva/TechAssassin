/**
 * Email Service - Backend
 * 
 * Handles email operations using SMTP for OTP and notifications
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

// Public logo URL to avoid Gmail attachment "pill"
const LOGO_URL = 'https://raw.githubusercontent.com/aryansondharva/TechAssassin/arya/Client/public/favicon.ico';

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
   * Base template for all system emails
   */
  private static getBaseTemplate(title: string, content: string, footer: string = 'This is an automated security notification.'): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;background:#ffffff;font-family:Arial,sans-serif;color:#111111;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 15px;">
          <tr>
            <td align="center">
              <!-- Card -->
              <table width="460" cellpadding="0" cellspacing="0" 
              style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;text-align:center;
              box-shadow:0 10px 25px rgba(0,0,0,0.08);">
                <!-- Logo -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <img src="${LOGO_URL}" alt="TechAssassin" width="65" style="display:block;margin:0 auto;" />
                  </td>
                </tr>
                <!-- Title -->
                <tr>
                  <td>
                    <h2 style="margin:0;color:#111111;font-weight:600;">
                      ${title}
                    </h2>
                  </td>
                </tr>
                <!-- Divider -->
                <tr>
                  <td>
                    <div style="width:40px;height:2px;background:#ef4444;margin:15px auto 20px;border-radius:2px;"></div>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td>
                    ${content}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td>
                    <p style="font-size:12px;color:#9ca3af;margin-top:20px;">
                      ${footer}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

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
    const emailContent = this.formatOTPEmail(otp, purpose, email);
    
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
   * Send Password Updated Confirmation
   */
  static async sendPasswordUpdatedConfirmation(email: string): Promise<void> {
    const content = `
      <p style="color:#374151;font-size:14px;margin:0 0 10px;">
        Your password has been successfully changed.
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 10px;">
        Account: <strong style="color:#111;">${email}</strong>
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 25px;line-height:1.6;">
        If you didn’t make this change, please contact support immediately to secure your account.
      </p>
    `;
    const html = this.getBaseTemplate('Password Updated', content);
    
    try {
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: email,
        subject: 'Security Alert: Password Updated',
        html: html,
      });
      console.log(`Password update confirmation sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password update confirmation:', error);
    }
  }

  /**
   * Format OTP email template
   */
  static formatOTPEmail(otp: string, purpose: string, email: string): { subject: string; html: string } {
    const subject = this.getSubject(purpose);
    const purposeTitle = this.getPurposeTitle(purpose);
    const purposeDesc = this.getPurposeDescription(purpose);

    const content = `
      <p style="color:#374151;font-size:14px;margin:0 0 10px;">
        ${purposeDesc}
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 10px;">
        Account: <strong style="color:#111;">${email}</strong>
      </p>
      
      <div style="background:#f9fafb;border-radius:8px;padding:24px;margin:24px 0;border:1px solid #f3f4f6;">
        <p style="font-size:11px;color:#9ca3af;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Verification Code</p>
        <div style="font-size:36px;font-weight:700;color:#ef4444;letter-spacing:8px;font-family:monospace;margin:10px 0;">${otp}</div>
        <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">Valid for ${OTP_EXPIRY_MINUTES} minutes</p>
      </div>

      <p style="color:#6b7280;font-size:13px;margin:25px 0 0;line-height:1.6;">
        Never share this code with anyone. If you didn't request this code, please contact support immediately.
      </p>
    `;

    const html = this.getBaseTemplate(purposeTitle, content);
    return { subject, html };
  }

  private static getSubject(purpose: string): string {
    switch (purpose) {
      case 'password_reset': return 'TechAssassin - Password Reset OTP';
      case 'login_verification': return 'TechAssassin - Login Verification OTP';
      case 'email_verification': return 'TechAssassin - Email Verification OTP';
      default: return 'TechAssassin - Verification OTP';
    }
  }

  private static getPurposeTitle(purpose: string): string {
    switch (purpose) {
      case 'password_reset': return 'Reset Password';
      case 'login_verification': return 'Login Verification';
      case 'email_verification': return 'Verify Email';
      default: return 'Account Verification';
    }
  }

  private static getPurposeDescription(purpose: string): string {
    switch (purpose) {
      case 'password_reset': return 'We received a request to reset your password. Use the following code to proceed.';
      case 'login_verification': return 'Use the following code to complete your login and verify your identity.';
      case 'email_verification': return 'Welcome to TechAssassin! Please use the code below to verify your email.';
      default: return 'Please use the verification code below to secure your account.';
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

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

  static async testEmail(email: string = 'study.aura.ai@gmail.com'): Promise<boolean> {
    try {
      const testOTP = this.generateOTP();
      await this.sendOTP({ email, otp: testOTP, purpose: 'email_verification' });
      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}

export default EmailService;
