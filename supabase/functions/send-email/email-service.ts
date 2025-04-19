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

    // Preparar datos del correo con valores validados
    const emailData: EmailData = {
      // Asegurarse de que guestName y guestEmail sean strings válidos
      guestName: params.to_name && typeof params.to_name === 'string' ? params.to_name.trim() : '',
      guestEmail: params.to_email && typeof params.to_email === 'string' ? params.to_email.trim() : '',
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
      diagramPoints: [],

      // Lista de administradores (separada de los datos del huésped)
      adminEmails: ["hernancalendar01@gmail.com", "luxeprbahia@gmail.com"]
    };

    // Seleccionar template avanzado según el tipo de evento
    let emailContent;
    if (emailData.type === 'guest-form') {
      // Correo inicial al guest
      emailContent = generarContenidoFormularioCreado(emailData);

      // Enviar alerta a administradores SOLO si no se está enviando una alerta específica
      // y si no hay un parámetro explícito que indique que no se debe enviar la alerta
      if (!params.skipAdminAlert && !emailData.adminAlert) {
        try {
          const adminAlert = generarContenidoAlertaFormularioCreado(emailData);
          await this.sendAdminAlert(adminAlert);
          console.log("Alerta a administradores enviada correctamente");
        } catch (error) {
          console.error("Error al enviar alerta a administradores:", error);
        }
      } else {
        console.log("Omitiendo alerta automática a administradores por configuración");
      }
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
    // Generar un asunto basado en los parámetros disponibles
    if (params.subject) {
      return params.subject;
    }

    if (params.property) {
      return `Golf Cart Inspection for ${params.property}`;
    }

    return 'Golf Cart Inspection Form';
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

  private async sendAdminAlert(emailContent: EmailContentParams) {
    try {
      // Verificar que hay destinatarios
      if (!Array.isArray(emailContent.to) || emailContent.to.length === 0) {
        console.warn("No hay destinatarios administrativos para enviar la alerta");
        return;
      }

      const payload = {
        from: emailContent.from,
        to: emailContent.to,
        subject: emailContent.subject,
        html: emailContent.html || '<p>No HTML content</p>'
      };

      console.log("Enviando alerta a administradores:", emailContent.to);

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseBody = await response.text();
      console.log("Respuesta de alerta a administradores:", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      });

      if (!response.ok) {
        throw new Error(`Error enviando alerta a administradores: ${responseBody || 'Sin detalles'}`);
      }

      return responseBody ? JSON.parse(responseBody) : null;
    } catch (error) {
      console.error("Error detallado al enviar alerta a administradores:", error);
      throw error;
    }
  }

  // Método simplificado para enviar correos directamente
  async sendDirectEmail(payload: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
  }) {
    try {
      // Asegurar que 'to' sea una cadena
      const to = Array.isArray(payload.to) ? payload.to.join(',') : payload.to;

      const emailPayload = {
        from: payload.from,
        to: to,
        subject: payload.subject,
        html: payload.html
      };

      console.log("Enviando correo directo a:", to);

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      const responseText = await response.text();
      console.log("Respuesta de correo directo:", {
        status: response.status,
        body: responseText
      });

      if (!response.ok) {
        throw new Error(`Error enviando correo directo: ${responseText}`);
      }

      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("Error en sendDirectEmail:", error);
      throw error;
    }
  }
}
