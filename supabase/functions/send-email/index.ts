import { EmailService } from './email-service';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const emailService = new EmailService(Deno.env.get('RESEND_API_KEY') || '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    console.log('Received request:', { type, data });

    if (type === 'guest-form') {
      await emailService.sendGuestFormEmail(data);
    } else if (type === 'completed-form') {
      await emailService.sendCompletedFormEmails(data);
    } else {
      throw new Error(`Invalid email type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in send-email function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});