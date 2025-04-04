export async function sendEmail(type: 'guest-form' | 'completed-form', data: any) {
  try {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
    const url = `${baseUrl}/functions/v1/send-email`;
    
    console.log('Sending email request to:', url);
    console.log('Email data:', { type, data });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type, data }),
    });

    if (!response.ok) {
      const responseData = await response.json();
      console.error('Email service error response:', responseData);
      const errorMessage = responseData.error || `HTTP error! status: ${response.status}`;
      if (errorMessage.includes('RESEND_API_KEY')) {
        throw new Error('Email service configuration error. Please contact support.');
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('Email service response:', responseData);
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Failed to send email');
    }

    return responseData;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    const errorMessage = error instanceof Error 
      ? error.message
      : 'Unknown error occurred while sending email';
    throw new Error(errorMessage);
  }
}