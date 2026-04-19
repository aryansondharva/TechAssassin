import { Resend } from 'resend'
import { Event } from '@/types/database'

// Initialize Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Event details for registration confirmation email
 */
export interface EventDetails {
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  status: 'confirmed' | 'waitlisted'
}

/**
 * Send registration confirmation email to user
 * Requirements: 11.1, 11.3, 11.4
 * 
 * @param to - Recipient email address
 * @param eventTitle - Title of the event
 * @param eventDetails - Event details including dates, location, and registration status
 */
export async function sendRegistrationConfirmation(
  to: string,
  eventTitle: string,
  eventDetails: EventDetails
): Promise<void> {
  try {
    await resend.emails.send({
      from: 'TechAssassin <noreply@techassassin.com>',
      to,
      subject: `Registration ${eventDetails.status === 'confirmed' ? 'Confirmed' : 'Received'}: ${eventTitle}`,
      html: renderRegistrationTemplate(eventDetails)
    })
  } catch (error) {
    // Log error but don't throw - email failure should not block registration
    console.error('Failed to send registration confirmation email:', error)
  }
}

/**
 * Send welcome email to new user
 * Requirements: 11.1, 11.3, 11.4
 * 
 * @param to - Recipient email address
 * @param username - User's username
 */
export async function sendWelcomeEmail(
  to: string,
  username: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: 'TechAssassin <noreply@techassassin.com>',
      to,
      subject: 'Welcome to TechAssassin!',
      html: renderWelcomeTemplate(username)
    })
  } catch (error) {
    // Log error but don't throw - email failure should not block user creation
    console.error('Failed to send welcome email:', error)
  }
}

/**
 * Render HTML template for registration confirmation email
 * Requirements: 11.2
 */
function renderRegistrationTemplate(eventDetails: EventDetails): string {
  const statusMessage = eventDetails.status === 'confirmed'
    ? 'Your registration has been confirmed!'
    : 'Your registration has been received and you are currently on the waitlist.'
  
  const statusColor = eventDetails.status === 'confirmed' ? '#10b981' : '#f59e0b'
  
  const startDate = new Date(eventDetails.start_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const endDate = new Date(eventDetails.end_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TechAssassin</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: ${statusColor}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 20px;">${statusMessage}</h2>
          </div>
          
          <h2 style="color: #667eea; margin-top: 0;">${eventDetails.title}</h2>
          
          <p style="color: #6b7280; margin-bottom: 20px;">${eventDetails.description}</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Event Details</h3>
            
            <p style="margin: 10px 0;">
              <strong>📅 Start:</strong><br>
              ${startDate}
            </p>
            
            <p style="margin: 10px 0;">
              <strong>📅 End:</strong><br>
              ${endDate}
            </p>
            
            <p style="margin: 10px 0;">
              <strong>📍 Location:</strong><br>
              ${eventDetails.location}
            </p>
            
            <p style="margin: 10px 0;">
              <strong>✅ Status:</strong><br>
              <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${eventDetails.status}</span>
            </p>
          </div>
          
          ${eventDetails.status === 'waitlisted' ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e;">
                <strong>⏳ Waitlist Information:</strong><br>
                You're on the waitlist for this event. We'll notify you if a spot becomes available. Keep an eye on your email!
              </p>
            </div>
          ` : ''}
          
          <p style="color: #6b7280;">
            We're excited to have you join us! If you have any questions, feel free to reach out to our team.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0;">
              TechAssassin - Building the Future, One Hack at a Time
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Render HTML template for welcome email
 * Requirements: 11.2
 */
function renderWelcomeTemplate(username: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TechAssassin</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TechAssassin!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #667eea; margin-top: 0;">Hey ${username}! 👋</h2>
          
          <p style="color: #374151; font-size: 16px;">
            We're thrilled to have you join the TechAssassin community! You're now part of a vibrant network of hackers, builders, and innovators.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">What's Next?</h3>
            
            <ul style="color: #6b7280; padding-left: 20px;">
              <li style="margin: 10px 0;">🎯 <strong>Complete your profile</strong> - Add your skills and GitHub to stand out</li>
              <li style="margin: 10px 0;">🚀 <strong>Browse events</strong> - Find hackathons that match your interests</li>
              <li style="margin: 10px 0;">👥 <strong>Join the community</strong> - Connect with fellow hackers</li>
              <li style="margin: 10px 0;">🏆 <strong>Start building</strong> - Register for your first event</li>
            </ul>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>💡 Pro Tip:</strong> Keep an eye on announcements for the latest updates, resources, and opportunities!
            </p>
          </div>
          
          <p style="color: #6b7280;">
            Ready to start your journey? Log in to your account and explore what TechAssassin has to offer!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://techassassin.com" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Get Started
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0;">
              TechAssassin - Building the Future, One Hack at a Time
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              Questions? Reach out to our support team anytime.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}
