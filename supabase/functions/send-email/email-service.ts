import { EmailData, EmailServiceParams } from "./types.ts";
import {
  generarContenidoFormularioCreado,
  generarContenidoAlertaFormularioCreado,
  generarContenidoFormularioFirmado,
  generarContenidoConfirmacion
} from "./email-templates.ts";


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

    // Seleccionar template avanzado según el tipo de evento
    let emailContent;
    if (emailData.type === 'guest-form') {
      // Correo inicial al guest
      emailContent = generarContenidoFormularioCreado(emailData);
    } else if (emailData.type === 'completed-form') {
      if (params.isAdmin) {
        // Correo a administradores con PDF firmado
        emailContent = generarContenidoFormularioFirmado(emailData);
      } else {
        // Confirmación al guest
        emailContent = generarContenidoConfirmacion(emailData);
      }
    } else {
      // Fallback: alerta a administradores
      emailContent = generarContenidoAlertaFormularioCreado(emailData);
    }

    console.log("Datos de email completos:", {
      from: emailContent.from,
      to: Array.isArray(emailContent.to) ? emailContent.to[0] : emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html ? 'HTML presente' : 'Sin HTML'
    });

    console.log("Datos completos de emailContent:", {
      from: emailContent.from,
      to: emailContent.to,
      subject: emailContent.subject,
      htmlLength: emailContent.html ? emailContent.html.length : 0
    });

    console.log("Datos completos de emailData:", {
      guestName: emailData.guestName,
      guestEmail: emailData.guestEmail,
      property: emailData.property
    });

    // Datos para el correo
    const payload = {
      from: 'Luxe Properties <noreply@luxepropertiespr.com>',
      to: emailData.guestEmail ? 
        `${emailData.guestName || 'Guest'} <${emailData.guestEmail}>` : 
        'hernancalendar01@gmail.com',
      subject: emailContent.subject,
      html: emailContent.html || '<p>No HTML content</p>',
      // Eliminar adjuntos de PDF
      attachments: undefined
    };

    console.log("Enviando correo con payload:", JSON.stringify(payload, null, 2));

    // Enviar correo
    let responseBody: string | null = null;
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      responseBody = await response.text();
      console.log("Respuesta completa de Resend:", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      });

      if (!response.ok) {
        throw new Error(`Error en el envío: ${responseBody || 'Sin detalles'}`);
      }

      return responseBody ? JSON.parse(responseBody) : null;
    } catch (error) {
      console.error("Error detallado al enviar correo:", {
        message: error.message,
        payload: payload,
        responseBody: responseBody || 'Sin respuesta'
      });
      throw error;
    }
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