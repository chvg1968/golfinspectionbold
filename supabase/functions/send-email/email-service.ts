import { Resend } from 'npm:resend@2.1.0';
import { EmailData } from './types';
import { getGuestFormEmailContent, getCompletedFormEmailContent } from './email-templates';

export class EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendGuestFormEmail(data: EmailData) {
    const emailContent = getGuestFormEmailContent(data);
    const { error } = await this.resend.emails.send(emailContent);
    
    if (error) {
      console.error('Error sending guest form email:', error);
      throw error;
    }
  }

  async sendCompletedFormEmails(data: EmailData) {
    if (!data.pdfBase64) {
      throw new Error('PDF data is missing');
    }

    // Send to admin
    const adminEmailContent = getCompletedFormEmailContent(data, true);
    const { error: adminError } = await this.resend.emails.send(adminEmailContent);

    if (adminError) {
      console.error('Error sending admin email:', adminError);
      throw adminError;
    }

    // Send to guest
    const guestEmailContent = getCompletedFormEmailContent(data, false);
    const { error: guestError } = await this.resend.emails.send(guestEmailContent);

    if (guestError) {
      console.error('Error sending guest copy email:', guestError);
      throw guestError;
    }
  }
}