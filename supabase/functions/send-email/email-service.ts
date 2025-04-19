import { EmailData, EmailServiceParams, EmailContentParams } from "./types.ts";
import { getFormCreatedAdminEmails, getFormCompletedAdminEmails, getDefaultSender, URLS } from "./config.ts";
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
      // Usamos la lista para formularios creados por defecto
      adminEmails: getFormCreatedAdminEmails()
    };

    // Seleccionar template avanzado según el tipo de evento
    let emailContent;

    // Determinar si es un correo para administradores
    const isAdminEmail = params.isAdmin || emailData.isAdmin;

    if (emailData.type === 'guest-form') {
      if (isAdminEmail) {
        // Si es un correo para administradores, usar la plantilla de alerta
        emailContent = generarContenidoAlertaFormularioCreado(emailData);
        // Enviar directamente usando el método unificado
        return this.sendAdminEmail(emailContent, 'created');
      } else {
        // Correo inicial al guest
        emailContent = generarContenidoFormularioCreado(emailData);

        // Enviar alerta a administradores SOLO si no se está enviando una alerta específica
        // y si no hay un parámetro explícito que indique que no se debe enviar la alerta
        if (!params.skipAdminAlert && !emailData.adminAlert) {
          try {
            const adminAlert = generarContenidoAlertaFormularioCreado(emailData);
            // Usar el nuevo método unificado
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
        // Correo a administradores con PDF firmado
        console.log("Generando contenido para administradores");
        emailContent = generarContenidoFormularioFirmado(emailData);
        console.log("Destinatarios del correo a administradores:", emailContent.to);

        // Enviar directamente usando el método unificado
        return this.sendAdminEmail(emailContent, 'completed');
      } else {
        // Confirmación al guest
        console.log("Generando contenido para huésped");
        emailContent = generarContenidoConfirmacion(emailData);
        console.log("Destinatarios del correo al huésped:", emailContent.to);
      }
    } else {
      // Fallback: alerta a administradores
      emailContent = generarContenidoAlertaFormularioCreado(emailData);

      // Si es un tipo desconocido pero es para administradores, enviar directamente
      if (isAdminEmail) {
        return this.sendAdminEmail(emailContent, 'created');
      }
    }

    // Si llegamos aquí, es porque estamos enviando un correo al huésped
    // Asegurarnos de que el emailContent tenga los destinatarios correctos
    if (!emailContent.to) {
      emailContent.to = emailData.guestEmail ?
        `${emailData.guestName || 'Guest'} <${emailData.guestEmail}>` :
        'hernancalendar01@gmail.com'; // Fallback por seguridad
    }

    // Asegurarnos de que el emailContent tenga el contenido HTML
    if (!emailContent.html) {
      emailContent.html = '<p>No HTML content</p>';
    }

    console.log("Enviando correo al huésped:", JSON.stringify({
      to: emailContent.to,
      subject: emailContent.subject
    }));

    // Verificar si el emailContent.to es un string con comas y convertirlo a array
    if (typeof emailContent.to === 'string' && emailContent.to.includes(',')) {
      console.log("Convirtiendo string con comas a array de destinatarios");
      emailContent.to = emailContent.to.split(',').map((email: string) => email.trim());
    }

    // Enviar correo
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
        message: error.message,
        to: emailContent.to,
        subject: emailContent.subject,
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

  /**
   * Método unificado para enviar correos a administradores
   * Este método reemplaza a sendAdminAlert y simplifica el envío de correos a administradores
   */
  async sendAdminEmail(emailContent: EmailContentParams, type: 'created' | 'completed' = 'created') {
    try {
      // Crear una copia del emailContent para evitar modificar el original
      const emailPayload = { ...emailContent };

      // Verificar que hay destinatarios
      if (!emailPayload.to) {
        console.warn("No hay destinatarios administrativos para enviar el correo");
        return;
      }

      // El emailContent ya es compatible con la API de Resend, así que lo usamos directamente
      console.log(`Enviando correo de formulario ${type} a administradores:`, emailPayload.to);

      // Verificar si el to es un string con comas y convertirlo a array
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
      console.error(`Error detallado al enviar correo de formulario ${type} a administradores:`, error);
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
