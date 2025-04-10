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
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      property: params.property,
      pdfBase64: params.pdfBase64 ? 'Base64 presente' : 'Base64 ausente'
    });

    // Eliminar procesamiento de puntos de diagrama
    const sanitizedDiagramPoints = [];

    // Preparar datos del correo
    const emailData: EmailData = {
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      property: params.property,
      type: params.type || 'guest-form',
      inspectionDate: params.inspectionDate,
      formLink: params.formLink,
      replyTo: params.replyTo,
      subject: params.subject || this.generateSubject(params),
      pdfBase64: params.pdfBase64,
      
      // Campos adicionales de inspección
      cartType: params.cartType,
      cartNumber: params.cartNumber,
      damages: params.damages,
      observations: params.observations,
      
      // Campos de firma y términos
      signatureBase64: params.signatureBase64,
      termsAccepted: params.termsAccepted,
      diagramBase64: params.diagramBase64,
      // Eliminar completamente los puntos de diagrama
      diagramPoints: []
    };

    // Seleccionar template según el tipo de correo
    const emailContent = emailData.type === 'guest-form'
      ? getGuestFormEmailContent(emailData)
      : getCompletedFormEmailContent(emailData, params.isAdmin);

    // Datos para el correo
    const payload = {
      from: emailContent.from,
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html,
      // Eliminar adjuntos de PDF
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
}