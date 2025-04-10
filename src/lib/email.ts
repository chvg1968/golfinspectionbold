export interface EmailParams {
  to_name: string;
  to_email: string;
  from_name?: string;
  from_email?: string;
  property: string;
  type?: 'guest-form' | 'completed-form';
  cart_type?: string;
  cart_number?: string;
  inspection_date?: string;
  form_link?: string;
  pdf_attachment?: string;
  reply_to?: string;
  subject?: string;
  observations?: string;
  diagram_base64?: string;
  formId?: string;
  isAdmin?: boolean;
  diagram_points?: Array<{
    x: number;
    y: number;
    color: string;
    size?: number;
  }>;
}

export function generateMessageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `<${timestamp}.${random}@luxepropertiespr.com>`;
}

export async function sendFormEmail(type: 'guest-form' | 'completed-form', params: EmailParams) {
  console.log('Iniciando envío de email...', { 
    type, 
    hasDiagramBase64: !!params.diagram_base64,
    diagramBase64Length: params.diagram_base64?.length
  });

  // Registro detallado de todos los parámetros
  console.log('Parámetros completos de email:', {
    to_email: params.to_email,
    to_name: params.to_name,
    property: params.property,
    cart_type: params.cart_type,
    cart_number: params.cart_number,
    inspection_date: params.inspection_date,
    form_link: params.form_link,
    pdf_attachment: params.pdf_attachment,
    diagram_points_count: params.diagram_points?.length
  });

  // Envío de correo con manejo de errores detallado
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        guestName: params.to_name,
        guestEmail: params.to_email,
        property: params.property,
        type: type,
        cartType: params.cart_type,
        cartNumber: params.cart_number,
        inspectionDate: params.inspection_date,
        formLink: params.form_link,
        pdfBase64: params.pdf_attachment,
        diagramPoints: params.diagram_points,
        replyTo: params.reply_to || 'support@luxepropertiespr.com',
        subject: params.subject || (
          type === 'guest-form' 
            ? `Formulario de Inspección de Carrito de Golf - ${params.property}`
            : `Inspección de Carrito de Golf Completada - ${params.property}`
        )
      })
    });

    console.log('Respuesta del servicio de correo:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error en la respuesta del servicio de correo:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });

      throw new Error(`Error al enviar correo: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    console.log('Resultado del envío de correo:', result);

    return result;
  } catch (error) {
    console.error('Error completo al enviar correo:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown error type',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });

    throw error;
  }
}