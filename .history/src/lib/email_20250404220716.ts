import emailjs from '@emailjs/browser';

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

export async function sendFormEmail(type: 'guest-form' | 'completed-form', data: any) {
  try {
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
        to_name: data.guestName,
        to_email: data.guestEmail,
        subject: `Golf Cart Inspection Form - ${data.property}`,
        property: data.property,
        inspection_date: data.inspectionDate,
        form_link: data.formLink,
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
      // Dividir el PDF en chunks más pequeños
      const chunks = [];
      const pdfData = data.pdfBase64 || '';
      const chunkSize = 250000; // Reducido a 250KB por chunk
      
      for (let i = 0; i < pdfData.length; i += chunkSize) {
        chunks.push(pdfData.slice(i, i + chunkSize));
      }

      // Enviar al huésped
      const guestParams: EmailParams = {
        ...commonEmailParams,
        to_name: data.guestName,
        to_email: data.guestEmail,
        subject: `Your Golf Cart Inspection - ${data.property}`,
        property: data.property,
        cart_type: data.inspectionData?.cartType || '',
        cart_number: data.inspectionData?.cartNumber || '',
        observations: data.inspectionData?.observations || 'No observations',
        pdf_attachment: chunks[0] || '',
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

      if (guestResponse.status !== 200) {
        throw new Error(`Error sending email to guest: ${guestResponse.text}`);
      }

      // Enviar al administrador con todos los chunks
      for (let i = 0; i < chunks.length; i++) {
        const adminParams: EmailParams = {
          ...commonEmailParams,
          to_name: 'Admin',
          to_email: 'hernancalendar01@gmail.com',
          subject: `Completed Inspection Form - ${data.property}`,
          property: data.property,
          cart_type: data.inspectionData?.cartType || '',
          cart_number: data.inspectionData?.cartNumber || '',
          observations: data.inspectionData?.observations || 'No observations',
          pdf_attachment: chunks[i],
          reply_to: data.guestEmail
        };

        const adminResponse = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID_COMPLETED,
          {
            ...adminParams,
            content_type: 'text/html; charset=utf-8',
            template_params: adminParams,
            headers: {
              'Message-ID': `${messageId}-part${i + 1}`,
              'X-Mailer': 'GolfCartInspection/1.0',
              'X-Entity-Ref-ID': `${messageId}-part${i + 1}`,
              'List-Unsubscribe': '<mailto:unsubscribe@email.golfcartinspection.app>',
              'Feedback-ID': messageId,
              'Precedence': 'bulk',
              'Auto-Submitted': 'auto-generated'
            }
          },
          EMAILJS_PUBLIC_KEY
        );

        if (adminResponse.status !== 200) {
          throw new Error(`Error sending email part ${i + 1} to admin: ${adminResponse.text}`);
        }

        // Añadir un pequeño delay entre chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
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
