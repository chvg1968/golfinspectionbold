import { Resend } from 'npm:resend@2.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    if (type === 'guest-form') {
      const { guestName, guestEmail, property, inspectionDate, formLink } = data;

      const { data: emailData, error } = await resend.emails.send({
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
      });

      if (error) {
        console.error('Error sending guest form email:', error);
        throw error;
      }

      console.log('Guest form email sent successfully:', emailData);

    } else if (type === 'completed-form') {
      const { guestName, guestEmail, property, inspectionData, pdfBase64 } = data;

      if (!pdfBase64) {
        throw new Error('PDF data is missing');
      }

      const { data: emailData, error } = await resend.emails.send({
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
              <p><strong>Cart Type:</strong> ${inspectionData.cartType}</p>
              <p><strong>Cart Number:</strong> ${inspectionData.cartNumber}</p>
              <p><strong>Observations:</strong> ${inspectionData.observations || 'No observations provided'}</p>
            </div>
            <p>Please find the completed inspection form attached.</p>
          </div>
        `,
        attachments: [
          {
            filename: `inspection-form-${property.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            content: pdfBase64,
          },
        ],
      });

      if (error) {
        console.error('Error sending completed form email:', error);
        throw error;
      }

      console.log('Completed form email sent successfully:', emailData);
    }

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email',
        details: error instanceof Error ? error.stack : undefined
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});