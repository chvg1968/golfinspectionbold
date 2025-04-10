import { EmailData, EmailServiceParams } from "./types.ts";
import { getGuestFormEmailContent, getCompletedFormEmailContent } from "./email-templates.ts";

export class EmailService {
  private API_ENDPOINT = "https://api.resend.com/emails";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: EmailServiceParams) {
    console.log("Datos completos para envío de correo:", {
      guestName: params.to_name,
      guestEmail: params.to_email,
      property: params.property,
      pdfBase64: params.pdf_attachment ? 'Base64 presente' : 'Base64 ausente'
    });

    // Preparar datos del correo
    const emailData: EmailData = {
      guestName: params.to_name || '',
      guestEmail: params.to_email || '',
      property: params.property,
      type: params.type || 'guest-form',
      inspectionDate: params.inspection_date,
      formLink: params.form_link || this.generateFormLink(params),
      formId: params.formId,
      replyTo: params.reply_to,
      subject: params.subject || this.generateSubject(params),
      pdfBase64: params.pdf_attachment,
      
      // Campos adicionales de inspección
      cartType: params.cart_type,
      cartNumber: params.cart_number,
      observations: params.observations,
      
      // Campos de firma y términos
      signatureBase64: params.signatureBase64,
      termsAccepted: params.termsAccepted,
      diagramBase64: params.diagramBase64,
      diagramPoints: []
    };

    // Seleccionar template según el tipo de correo
    const emailContent = emailData.type === 'guest-form'
      ? getGuestFormEmailContent(emailData)
      : getCompletedFormEmailContent(emailData, params.isAdmin);

    console.log("Datos de email completos:", {
      from: emailContent.from,
      to: Array.isArray(emailContent.to) ? emailContent.to[0] : emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html ? 'HTML presente' : 'Sin HTML'
    });

    // Datos para el correo
    const payload = {
      from: emailContent.from,
      to: Array.isArray(emailContent.to) ? emailContent.to[0] : emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments: undefined
    };

    console.log("Enviando correo con datos:", JSON.stringify(payload, null, 2));

    // Enviar correo
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log("Respuesta de la API de correo:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error al enviar correo:", {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error al enviar correo: ${errorText}`);
    }

    return response;
  }

  private generateSubject(params: EmailServiceParams): string {
    const baseSuffix = `Inspección de Carrito - ${params.property}`;
    
    if (params.type === 'guest-form') {
      return `Formulario de Inspección Inicial: ${baseSuffix}`;
    } else if (params.type === 'completed-form') {
      return `Formulario de Inspección Completado: ${baseSuffix}`;
    }
    
    return `Inspección de Carrito: ${baseSuffix}`;
  }

  private generateFormLink(params: EmailServiceParams): string {
    // Generar un link basado en los parámetros disponibles
    const baseUrl = 'https://golf-cart-inspection.netlify.app';
    
    if (params.formId) {
      return `${baseUrl}/inspection/${params.formId}`;
    }
    
    if (params.to_name && params.property) {
      const sluggedName = params.to_name.toLowerCase().replace(/\s+/g, '-');
      const sluggedProperty = params.property.toLowerCase().replace(/\s+/g, '-');
      return `${baseUrl}/inspection/${sluggedName}-${sluggedProperty}-${Date.now()}`;
    }
    
    return `${baseUrl}/inspection`;
  }
}