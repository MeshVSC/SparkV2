import { NotificationData, NotificationDelivery, NotificationChannel, NotificationChannelHandler } from '@/types/notification';

export class EmailChannelHandler implements NotificationChannelHandler {
  channel = NotificationChannel.EMAIL;

  async send(notification: NotificationData, delivery: NotificationDelivery): Promise<boolean> {
    try {
      // In a production environment, you would integrate with an email service
      // such as SendGrid, AWS SES, Nodemailer, etc.
      
      const emailData = this.buildEmailData(notification);
      const success = await this.sendEmail(emailData);
      
      if (success) {
        console.log(`Email notification sent successfully to user ${notification.userId}`);
        return true;
      } else {
        console.error(`Failed to send email notification to user ${notification.userId}`);
        return false;
      }
    } catch (error) {
      console.error('Email notification delivery failed:', error);
      return false;
    }
  }

  private buildEmailData(notification: NotificationData): EmailData {
    return {
      to: this.getUserEmail(notification.userId),
      subject: notification.title,
      htmlContent: this.buildHtmlContent(notification),
      textContent: this.buildTextContent(notification),
      metadata: {
        notificationId: notification.id,
        notificationType: notification.type,
        userId: notification.userId
      }
    };
  }

  private buildHtmlContent(notification: NotificationData): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .notification-data { background-color: #e5e7eb; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Spark Notification</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.data ? this.buildDataSection(notification.data) : ''}
            <a href="${baseUrl}" class="button">Open Spark App</a>
          </div>
          <div class="footer">
            <p>This is an automated message from Spark. Please do not reply to this email.</p>
            <p>If you no longer wish to receive these notifications, you can update your preferences in the app.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildTextContent(notification: NotificationData): string {
    let content = `${notification.title}\n\n${notification.message}\n\n`;
    
    if (notification.data) {
      content += 'Additional Information:\n';
      Object.entries(notification.data).forEach(([key, value]) => {
        content += `${key}: ${value}\n`;
      });
      content += '\n';
    }
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    content += `Open Spark App: ${baseUrl}\n\n`;
    content += 'This is an automated message from Spark. Please do not reply to this email.';
    
    return content;
  }

  private buildDataSection(data: Record<string, any>): string {
    const entries = Object.entries(data)
      .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
      .join('<br>');
    
    return `<div class="notification-data">${entries}</div>`;
  }

  private async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Mock email sending for development
      // In production, replace with actual email service integration
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Mock Email Sent:');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('Content Preview:', emailData.textContent.substring(0, 100) + '...');
        return true;
      }

      // Example SendGrid integration (commented out):
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: emailData.to,
        from: process.env.FROM_EMAIL || 'notifications@spark.app',
        subject: emailData.subject,
        text: emailData.textContent,
        html: emailData.htmlContent,
        customArgs: emailData.metadata
      };
      
      await sgMail.send(msg);
      return true;
      */

      // Example Nodemailer integration (commented out):
      /*
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail', // or your email service
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'notifications@spark.app',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.textContent,
        html: emailData.htmlContent
      });
      
      return true;
      */

      // For now, return true to simulate successful sending
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  private getUserEmail(userId: string): string {
    // In production, this would query the database to get the user's email
    // For now, return a mock email
    return `user-${userId}@example.com`;
  }

  validateConfig(config: EmailConfig): boolean {
    // Validate email configuration
    if (!config.fromEmail || !config.fromEmail.includes('@')) {
      return false;
    }
    
    if (config.provider === 'sendgrid' && !config.apiKey) {
      return false;
    }
    
    if (config.provider === 'smtp' && (!config.host || !config.port)) {
      return false;
    }
    
    return true;
  }
}

interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  metadata: Record<string, any>;
}

interface EmailConfig {
  provider: 'sendgrid' | 'smtp' | 'ses';
  fromEmail: string;
  apiKey?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}