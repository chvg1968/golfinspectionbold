import { EmailData, EmailServiceParams, EmailContentParams } from "./types.ts";
import { getFormCreatedAdminEmails } from "./config.ts";
import {
  generarContenidoFormularioCreado,
  generarContenidoAlertaFormularioCreado,
  generarContenidoFormularioFirmado,
  generarContenidoConfirmacion
} from "./email-templates.ts";

export class EmailService {
  private readonly API_ENDPOINT = "https://api.resend.com/emails";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(params: EmailServiceParams): Promise<unknown> {
    console.log("Datos completos para envío de correo:", {
      guestName: params.to_name,
      guestEmail: params.to_email,
      property: params.property,
      pdfBase64: params.pdf_attachment ? 'Base64 presente' : 'Base64 ausente'
    });

    const emailData: EmailData = {
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
      cartType: params.cart_type,
      cartNumber: params.cart_number,
      observations: params.observations,
      signatureBase64: params.signatureBase64,
      termsAccepted: params.termsAccepted,
      diagramBase64: params.diagramBase64,
      diagramPoints: [],
      adminEmails: getFormCreatedAdminEmails()
    };

    let emailContent: EmailContentParams;

    const isAdminEmail = params.isAdmin || emailData.isAdmin;

    if (emailData.type === 'guest-form') {
      if (isAdminEmail) {
        emailContent = generarContenidoAlertaFormularioCreado(emailData);
        return this.sendAdminEmail(emailContent, 'created');
      } else {
        emailContent = generarContenidoFormularioCreado(emailData);

        if (!params.skipAdminAlert && !emailData.adminAlert) {
          try {
            const adminAlert = generarContenidoAlertaFormularioCreado(emailData);
            await this.sendAdminEmail(adminAlert, 'created');
            console.log("Alerta a administradores enviada correctamente");
          } catch (error) {
            console.error("Error al enviar alerta a administradores:", error);
          }
        } else {
          console.log("Omitiendo alerta automática a administradores por configuración");
        }
      }
    } else if (emailData.type === 'completed-form') {
      console.log("Procesando correo de formulario completado:", {
        isAdmin: isAdminEmail,
        to: emailData.guestEmail,
        adminEmails: emailData.adminEmails
      });

      if (isAdminEmail) {
        console.log("Generando contenido para administradores");
        emailContent = generarContenidoFormularioFirmado(emailData);
        console.log("Destinatarios del correo a administradores:", emailContent.to);
        return this.sendAdminEmail(emailContent, 'completed');
      } else {
        console.log("Generando contenido para huésped");
        emailContent = generarContenidoConfirmacion(emailData);
        console.log("Destinatarios del correo al huésped:", emailContent.to);
      }
    } else {
      emailContent = generarContenidoAlertaFormularioCreado(emailData);

      if (isAdminEmail) {
        return this.sendAdminEmail(emailContent, 'created');
      }
    }

    if (!emailContent.to) {
      emailContent.to = emailData.guestEmail ?
        `${emailData.guestName || 'Guest'} <${emailData.guestEmail}>` :
        'hernancalendar01@gmail.com';
    }

    if (!emailContent.html) {
      emailContent.html = '<p>No HTML content</p>';
    }

    console.log("Enviando correo al huésped:", JSON.stringify({
      to: emailContent.to,
      subject: emailContent.subject
    }));

    if (typeof emailContent.to === 'string' && emailContent.to.includes(',')) {
      console.log("Convirtiendo string con comas a array de destinatarios");
      emailContent.to = emailContent.to.split(',').map((email: string) => email.trim());
    }

    let responseBody: string | null = null;
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailContent)
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
        message: error instanceof Error ? error.message : 'Error desconocido',
        to: emailContent.to,
        subject: emailContent.subject,
        responseBody: responseBody || 'Sin respuesta'
      });
      throw error;
    }
  }

  private generateSubject(params: EmailServiceParams): string {
    if (params.subject) {
      return params.subject;
    }

    if (params.property) {
      return `Golf Cart Inspection for ${params.property}`;
    }

    return 'Golf Cart Inspection Form';
  }

  private generateFormLink(params: EmailServiceParams): string {
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

  async sendAdminEmail(emailContent: EmailContentParams, type: 'created' | 'completed' = 'created'): Promise<unknown> {
    try {
      const emailPayload = { ...emailContent };

      if (!emailPayload.to) {
        console.warn("No hay destinatarios administrativos para enviar el correo");
        return;
      }

      console.log(`Enviando correo de formulario ${type} a administradores:`, emailPayload.to);

      if (typeof emailPayload.to === 'string' && emailPayload.to.includes(',')) {
        console.log("Convirtiendo string con comas a array de destinatarios");
        emailPayload.to = emailPayload.to.split(',').map((email: string) => email.trim());
      }

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      const responseBody = await response.text();
      console.log(`Respuesta de correo de formulario ${type} a administradores:`, {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      });

      if (!response.ok) {
        throw new Error(`Error enviando correo a administradores: ${responseBody || 'Sin detalles'}`);
      }

      return responseBody ? JSON.parse(responseBody) : null;
    } catch (error) {
      console.error("Error al enviar correo a administradores:", {
        message: error instanceof Error ? error.message : 'Error desconocido',
        type
      });
      throw error;
    }
  }

  // Mantenemos el método original por compatibilidad, pero ahora usa el nuevo método unificado
  private async sendAdminAlert(emailContent: EmailContentParams) {
    return this.sendAdminEmail(emailContent, 'created');
  }

  // Método simplificado para enviar correos directamente
  async sendDirectEmail(payload: EmailContentParams) {
    try {
      // Crear una copia del payload para evitar modificar el original
      const emailPayload = { ...payload };

      console.log("Enviando correo directo a:", typeof emailPayload.to === 'string' ? emailPayload.to : JSON.stringify(emailPayload.to));

      // Verificar que el payload.to sea un array si contiene múltiples destinatarios
      if (typeof emailPayload.to === 'string' && emailPayload.to.includes(',')) {
        console.log("Convirtiendo string con comas a array de destinatarios");
        emailPayload.to = emailPayload.to.split(',').map((email: string) => email.trim());
      }

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
