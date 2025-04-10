import { EmailData, EmailContentParams } from './types.ts';

export function getGuestFormEmailContent(data: EmailData): EmailContentParams {
  const { 
    guestName, 
    guestEmail, 
    property, 
    inspectionDate, 
    formLink, 
  } = data;
  
  return {
    from: 'Luxe Properties <noreply@luxepropertiespr.com>',
    to: [guestEmail],
    subject: `Golf Cart Inspection Form for ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Golf Cart Inspection Form</h2>
        <p style="margin-bottom: 15px;">Dear ${guestName},</p>
        <p style="margin-bottom: 20px;">An inspection form has been created for the golf cart at ${property}. Please complete this form at your earliest convenience.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${formLink}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;
                    font-size: 16px;">
            Complete Inspection Form
          </a>
        </div>
        <p style="margin-bottom: 10px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="margin-bottom: 20px; word-break: break-all; color: #4a5568;">${formLink}</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p style="margin-bottom: 10px;"><strong>Property:</strong> ${property}</p>
          <p style="margin-bottom: 10px;"><strong>Inspection Date:</strong> ${inspectionDate}</p>
        </div>
        <p style="color: #666; margin-bottom: 20px;">If you have any questions, please reply to this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666;">Best regards,<br>Golf Cart Inspection Team</p>
      </div>
    `
  };
}

export function getCompletedFormEmailContent(data: EmailData, isAdmin = false): EmailContentParams {
  const { guestName, guestEmail, property, cartType, cartNumber, observations, formLink } = data;
  
  // Definir attachments como un array vacío con el tipo correcto
  const attachments: Array<{filename: string, content: string}> = [];

  // Correo para el guest
  const guestEmailContent = {
    from: 'Luxe Properties <noreply@luxepropertiespr.com>',
    to: [guestEmail],
    subject: `Your Golf Cart Inspection Form - ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Your Golf Cart Inspection Form</h2>
        <p>Thank you for completing the golf cart inspection form. You can view the signed PDF at:</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${formLink}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;
                    font-size: 16px;">
            View Signed PDF
          </a>
        </div>
        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p><strong>Property:</strong> ${property}</p>
          <p><strong>Cart Type:</strong> ${cartType}</p>
          <p><strong>Cart Number:</strong> ${cartNumber}</p>
        </div>
      </div>
    `,
    attachments
  };

  // Correo para el administrador
  const adminEmailContent = {
    from: 'Luxe Properties <noreply@luxepropertiespr.com>',
    to: ['hernancalendar01@gmail.com'],
    reply_to: guestEmail,
    subject: `Completed Inspection Form - ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Completed Inspection Form</h2>
        <p>A guest has completed their golf cart inspection form.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p><strong>Guest Name:</strong> ${guestName}</p>
          <p><strong>Guest Email:</strong> ${guestEmail}</p>
          <p><strong>Property:</strong> ${property}</p>
          <p><strong>Cart Type:</strong> ${cartType}</p>
          <p><strong>Cart Number:</strong> ${cartNumber}</p>
          <p><strong>Observations:</strong> ${observations || 'No observations provided'}</p>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${formLink}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;
                    font-size: 16px;">
            View Signed PDF
          </a>
        </div>
      </div>
    `,
    attachments
  };

  // Si es admin, devolver correo de admin
  return isAdmin ? adminEmailContent : guestEmailContent;
}