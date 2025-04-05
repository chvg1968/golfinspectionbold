import { EmailData } from './types';

export function getGuestFormEmailContent(data: EmailData) {
  const { guestName, guestEmail, property, inspectionDate, formLink } = data;
  
  return {
    from: 'Golf Cart Inspection <onboarding@resend.dev>',
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

export function getCompletedFormEmailContent(data: EmailData, isAdmin = false) {
  const { guestName, guestEmail, property, inspectionData, pdfBase64 } = data;
  
  const filename = `inspection-form-${property.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  const attachments = pdfBase64 ? [
    {
      filename,
      content: pdfBase64,
    },
  ] : [];

  if (isAdmin) {
    return {
      from: 'Golf Cart Inspection <onboarding@resend.dev>',
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
            <p><strong>Cart Type:</strong> ${inspectionData?.cartType}</p>
            <p><strong>Cart Number:</strong> ${inspectionData?.cartNumber}</p>
            <p><strong>Observations:</strong> ${inspectionData?.observations || 'No observations provided'}</p>
          </div>
          <p>Please find the completed inspection form attached.</p>
        </div>
      `,
      attachments,
    };
  }

  return {
    from: 'Golf Cart Inspection <onboarding@resend.dev>',
    to: [guestEmail],
    subject: `Your Golf Cart Inspection Form - ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Your Golf Cart Inspection Form</h2>
        <p>Thank you for completing the golf cart inspection form. Please find your copy attached.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p><strong>Property:</strong> ${property}</p>
          <p><strong>Cart Type:</strong> ${inspectionData?.cartType}</p>
          <p><strong>Cart Number:</strong> ${inspectionData?.cartNumber}</p>
          <p><strong>Observations:</strong> ${inspectionData?.observations || 'No observations provided'}</p>
        </div>
        <p>Please keep this email for your records.</p>
      </div>
    `,
    attachments,
  };
}