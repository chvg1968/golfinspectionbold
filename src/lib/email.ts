import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init({
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
});

const EMAILJS_SERVICE_ID = 'service_7h35thn';
const EMAILJS_TEMPLATE_ID_GUEST = 'template_nua7xlj';
const EMAILJS_TEMPLATE_ID_COMPLETED = 'template_uvyqe6a';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface EmailParams {
  to_name: string;
  to_email: string;
  from_name: string;
  from_email: string;
  property: string;
  inspection_date?: string;
  form_link?: string;
  cart_type?: string;
  cart_number?: string;
  observations?: string;
  pdf_attachment?: string;
  reply_to?: string;
  subject?: string;
  message_id?: string;
}

function generateMessageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `<${timestamp}.${random}@email.golfcartinspection.app>`;
}

export async function sendFormEmail(type: 'guest-form' | 'completed-form', data: EmailParams) {
  try {
    console.log('Iniciando envío de email...', { type, serviceId: EMAILJS_SERVICE_ID, templateId: type === 'guest-form' ? EMAILJS_TEMPLATE_ID_GUEST : EMAILJS_TEMPLATE_ID_COMPLETED });
    const messageId = generateMessageId();
    const commonEmailParams = {
      from_name: 'Golf Cart Inspection System',
      from_email: 'no-reply@email.golfcartinspection.app',
      message_id: messageId,
      dkim: 'v=1',
      spf: 'v=1',
      precedence: 'bulk',
      auto_submit: 'auto-generated',
      feedback_id: messageId,
    };

    if (type === 'guest-form') {
      const templateParams: EmailParams = {
        ...commonEmailParams,
        ...data,
        subject: `Golf Cart Inspection Form - ${data.property}`,
        reply_to: 'support@email.golfcartinspection.app'
      };

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_GUEST,
        {
          ...templateParams,
          content_type: 'text/html; charset=utf-8',
          template_params: templateParams,
          headers: {
            'Message-ID': messageId,
            'X-Mailer': 'GolfCartInspection/1.0',
            'X-Entity-Ref-ID': messageId,
            'List-Unsubscribe': '<mailto:unsubscribe@email.golfcartinspection.app>',
            'Feedback-ID': messageId,
            'Precedence': 'bulk',
            'Auto-Submitted': 'auto-generated'
          }
        },
        EMAILJS_PUBLIC_KEY
      );

      if (response.status !== 200) {
        throw new Error(`Error sending email to guest: ${response.text}`);
      }
    } else if (type === 'completed-form') {
      // Enviar al huésped
      const guestParams: EmailParams = {
        ...commonEmailParams,
        ...data,
        subject: `Your Golf Cart Inspection - ${data.property}`,
        reply_to: 'support@email.golfcartinspection.app'
      };

      const guestResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_COMPLETED,
        {
          ...guestParams,
          content_type: 'text/html; charset=utf-8',
          template_params: guestParams,
          headers: {
            'Message-ID': messageId,
            'X-Mailer': 'GolfCartInspection/1.0',
            'X-Entity-Ref-ID': messageId,
            'List-Unsubscribe': '<mailto:unsubscribe@email.golfcartinspection.app>',
            'Feedback-ID': messageId,
            'Precedence': 'bulk',
            'Auto-Submitted': 'auto-generated'
          }
        },
        EMAILJS_PUBLIC_KEY
      );

      console.log('Respuesta del envío:', guestResponse);
      if (guestResponse.status !== 200) {
        console.error('Error en la respuesta:', guestResponse);
        throw new Error(`Error sending email to guest: ${guestResponse.text || 'Unknown error'}`);
      }

      // Enviar al administrador
      const adminParams: EmailParams = {
        ...commonEmailParams,
        to_name: 'Admin',
        to_email: 'hernancalendar01@gmail.com',
        subject: `Completed Inspection Form - ${data.property}`,
        property: data.property,
        cart_type: data.cart_type || '',
        cart_number: data.cart_number || '',
        observations: data.observations || 'No observations',
        pdf_attachment: data.pdf_attachment, // Usar el enlace del PDF de Supabase
        reply_to: data.to_email
      };

      const adminResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_COMPLETED,
        {
          ...adminParams,
          content_type: 'text/html; charset=utf-8',
          template_params: adminParams,
          headers: {
            'Message-ID': messageId,
            'X-Mailer': 'GolfCartInspection/1.0',
            'X-Entity-Ref-ID': messageId,
            'List-Unsubscribe': '<mailto:unsubscribe@email.golfcartinspection.app>',
            'Feedback-ID': messageId,
            'Precedence': 'bulk',
            'Auto-Submitted': 'auto-generated'
          }
        },
        EMAILJS_PUBLIC_KEY
      );

      if (adminResponse.status !== 200) {
        throw new Error(`Error sending email to admin: ${adminResponse.text}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendEmail:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unexpected error sending email');
  }
}