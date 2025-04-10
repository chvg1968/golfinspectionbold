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
  
  const attachments: Array<{filename: string, content: string}> = [];

  const companyInfo = {
    name: 'Luxe Properties',
    address: '123 Golf Lane, San Juan, Puerto Rico',
    phone: '+1 (787) 555-1234',
    website: 'https://luxepropertiespr.com',
    logoUrl: 'https://luxepropertiespr.com/wp-content/uploads/2024/09/LOGO.png'
  };

  const baseStyles = `
    font-family: Arial, sans-serif; 
    max-width: 600px; 
    margin: 0 auto; 
    padding: 20px; 
    line-height: 1.6;
    color: #333;
  `;

  const buttonStyles = `
    background-color: #4CAF50; 
    color: white;   
    padding: 15px 30px; 
    text-decoration: none; 
    border-radius: 5px; 
    display: inline-block;
    font-weight: bold;
    font-size: 16px;
    margin: 20px 0;
  `;

  const guestEmailContent = {
    from: `${companyInfo.name} <noreply@luxepropertiespr.com>`,
    to: [guestEmail],
    subject: `Golf Cart Inspection Completed - ${property}`,
    html: `
      <div style="${baseStyles}">
        <img src="${companyInfo.logoUrl}" alt="${companyInfo.name} Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Inspection Form Confirmation</h2>
        <p>Dear ${guestName},</p>
        <p>Thank you for completing the golf cart inspection form for ${property}. Your signed document is now ready.</p>
        
        <div style="text-align: center;">
          <a href="${formLink}" style="${buttonStyles}">View Signed PDF</a>
        </div>
        
        <div style="background-color: #f7fafc; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p><strong>Property:</strong> ${property}</p>
          <p><strong>Cart Type:</strong> ${cartType}</p>
          <p><strong>Cart Number:</strong> ${cartNumber}</p>
        </div>
        
        <p style="margin-top: 20px;">If you have any questions, please contact us:</p>
        <p>
          📞 ${companyInfo.phone}<br>
          🌐 ${companyInfo.website}
        </p>
        
        <p style="color: #666; margin-top: 30px; font-size: 12px;">
          ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.<br>
          ${companyInfo.address}
        </p>
        
        <p style="font-size: 10px; color: #999;">
          This is a transactional email. Please do not reply to this message.
        </p>
      </div>
    `,
    attachments,
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@luxepropertiespr.com?subject=Unsubscribe>`
    }
  };

  const adminEmailContent = {
    from: `${companyInfo.name} <noreply@luxepropertiespr.com>`,
    to: ['hernancalendar01@gmail.com'],
    reply_to: guestEmail,
    subject: `Completed Inspection - ${property}`,
    html: `
      <div style="${baseStyles}">
        <img src="${companyInfo.logoUrl}" alt="${companyInfo.name} Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">New Inspection Completed</h2>
        
        <div style="background-color: #f7fafc; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p><strong>Guest Name:</strong> ${guestName}</p>
          <p><strong>Guest Email:</strong> ${guestEmail}</p>
          <p><strong>Property:</strong> ${property}</p>
          <p><strong>Cart Type:</strong> ${cartType}</p>
          <p><strong>Cart Number:</strong> ${cartNumber}</p>
          <p><strong>Observations:</strong> ${observations || 'No observations provided'}</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${formLink}" style="${buttonStyles}">View Signed PDF</a>
        </div>
        
        <p style="margin-top: 20px;">
          ${companyInfo.address}<br>
          ${companyInfo.phone}<br>
          ${companyInfo.website}
        </p>
        
        <p style="color: #666; margin-top: 30px; font-size: 12px;">
          ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.
        </p>
      </div>
    `,
    attachments
  };

  return isAdmin ? adminEmailContent : guestEmailContent;
}