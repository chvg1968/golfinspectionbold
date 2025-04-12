import React from 'react';
import { Send } from 'lucide-react';
import { sendFormEmail } from '../lib/email';

interface EmailServiceProps {
  type: 'guest-form' | 'completed-form';
  data: {
    guestName: string;
    guestEmail: string;
    property: string;
    inspectionDate?: string;
    formLink?: string;
    inspectionData?: {
      observations: string;
      cartType?: string;
      cartNumber: string;
    };
    pdfUrl?: string;
  };
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export async function sendFormEmail({ type, data, onSuccess, onError }: EmailServiceProps) {
  try {
    const emailData = {
      to_name: data.guestName,
      to_email: data.guestEmail,
      property: data.property,
      inspection_date: data.inspectionDate,
      form_link: data.formLink,
      cart_type: data.inspectionData?.cartType,
      cart_number: data.inspectionData?.cartNumber,
      observations: data.inspectionData?.observations,
      pdf_url: data.pdfUrl
    };

    await sendFormEmail(type, emailData);
    onSuccess();
  } catch (error) {
    console.error('Error sending email:', error);
    onError(error instanceof Error ? error : new Error('Failed to send email'));
  }
}

interface EmailButtonProps {
  isGuestView: boolean;
  isSending: boolean;
  disabled?: boolean;
}

export function EmailButton({ isGuestView, isSending, disabled }: EmailButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isSending}
      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Send className="w-4 h-4 mr-2" />
      {isSending ? 'Sending...' : (isGuestView ? 'Submit Form' : 'Send to Guest')}
    </button>
  );
}