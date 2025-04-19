
import { EmailData, EmailContentParams} from "./types.ts";
import {
  getDefaultSender,
  getFormCreatedAdminEmails,
  getFormCompletedAdminEmails
} from "./config.ts";

// Las funciones avanzadas de template de email están exportadas al final de este archivo:
// - generarContenidoFormularioCreado
// - generarContenidoAlertaFormularioCreado
// - generarContenidoFormularioFirmado
// - generarContenidoConfirmacion
// Puedes importarlas desde otros módulos según el evento de email que necesites.


// Función generadora para el evento FORMULARIO_CREADO (correo inicial al guest)
export function generarContenidoFormularioCreado(
  data: EmailData
): EmailContentParams {
  // Plantilla personalizada para el primer correo al guest (UNIFICADA)
  const { guestName, guestEmail, property, inspectionDate, formLinkWithDomain, formLink } = data;

  return {
    from: getDefaultSender(),
    to: [guestEmail!],
    subject: `Golf Cart Inspection Form for ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <img src="https://luxepropertiespr.com/wp-content/uploads/2024/09/LOGO.png" alt="Luxe Properties Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Golf Cart Inspection Form</h2>
        <p style="margin-bottom: 15px;">Dear ${guestName},</p>
        <p style="margin-bottom: 20px;">An inspection form has been created for the golf cart at ${property}. Please complete this form at your earliest convenience.</p>
        <p style="margin-bottom: 20px;">For a better experience in mobile devices, please rotate your device to landscape mode.</p>
        <div style="margin: 30px 0; text-align: center;">
          ${
            formLinkWithDomain || formLink
              ? `<a href='${
                  formLinkWithDomain || formLink
                }' style='background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;'>Review and Sign Form</a>`
              : `<span style='color: #e53e3e;'>No valid inspection form link available. Please contact support.</span>`
          }
        </div>
        <p style="margin-bottom: 10px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        ${
          formLinkWithDomain || formLink
            ? `<p style='margin-bottom: 20px; word-break: break-all; color: #4a5568;'>${
                formLinkWithDomain || formLink
              }</p>`
            : ''
        }
        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p style="margin-bottom: 10px;"><strong>Property:</strong> ${property}</p>
          <p style="margin-bottom: 10px;"><strong>Inspection Date:</strong> ${inspectionDate}</p>
        </div>
        <p style="color: #666; margin-bottom: 20px;">If you have any questions, please reply to this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666;">Best regards,<br>Luxe Properties</p>
      </div>
    `,
  };
}

// Plantilla de alerta para administradores cuando se crea un formulario
export function generarContenidoAlertaFormularioCreado(
  data: EmailData
): EmailContentParams {
  const { guestName, guestEmail, property, inspectionDate, adminEmails } = data;

  // Obtener la lista de administradores para alertas de formulario creado
  // Usar adminEmails si existe, de lo contrario usar la lista específica
  const recipients = Array.isArray(adminEmails) && adminEmails.length > 0
    ? adminEmails.filter((e): e is string => !!e)
    : getFormCreatedAdminEmails();

  console.log("Destinatarios de alerta a administradores:", recipients);

  return {
    from: getDefaultSender(),
    to: recipients,
    subject: `Alert: New form has been created for ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3>New inspection form created</h3>
        <p>A new inspection form has been created for the property <strong>${property}</strong>.</p>
        <p><strong>Guest Name:</strong> ${guestName || "N/A"}</p>
        <p><strong>Guest Email:</strong> ${guestEmail || "N/A"}</p>
        <p><strong>Inspection Date:</strong> ${inspectionDate || "N/A"}</p>
      </div>
    `,
  };
}

// Función generadora para el evento FORMULARIO_FIRMADO (correo a administradores con PDF)
export function generarContenidoFormularioFirmado(
  data: EmailData
): EmailContentParams {
  const {
    guestName,
    guestEmail,
    property,
    cartType,
    cartNumber,
    observations,
  } = data;

  // Verificar que tenemos datos válidos del huésped
  if (!guestName || !guestEmail) {
    console.warn("Datos de huésped incompletos en generarContenidoFormularioFirmado:", { guestName, guestEmail });
  }

  return {
    from: getDefaultSender(),
    to: getFormCompletedAdminEmails(),
    subject: `Golf Cart Inspection Completed - ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <img src="https://luxepropertiespr.com/wp-content/uploads/2024/09/LOGO.png" alt="Luxe Properties Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Golf Cart Inspection Completed</h2>

        <p>A guest has completed and signed a golf cart inspection form. Details below:</p>

        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p><strong>Guest Information:</strong></p>
          <p style="margin-left: 15px;"><strong>Name:</strong> ${guestName || "N/A"}</p>
          <p style="margin-left: 15px;"><strong>Email:</strong> ${guestEmail || "N/A"}</p>

          <p style="margin-top: 15px;"><strong>Inspection Details:</strong></p>
          <p style="margin-left: 15px;"><strong>Property:</strong> ${property || "N/A"}</p>
          <p style="margin-left: 15px;"><strong>Date:</strong> ${data.inspectionDate || "N/A"}</p>
          <p style="margin-left: 15px;"><strong>Cart Type:</strong> ${cartType || "N/A"}</p>
          <p style="margin-left: 15px;"><strong>Cart Number:</strong> ${cartNumber || "N/A"}</p>

          <p style="margin-top: 15px;"><strong>Guest Observations:</strong></p>
          <p style="margin-left: 15px;">${observations || "No observations provided"}</p>
        </div>
        <p style="color: #666;">Luxe Properties</p>
      </div>
    `,
  };
}

// Función generadora para el evento CONFIRMACION (correo al guest confirmando que firmó)
export function generarContenidoConfirmacion(
  data: EmailData
): EmailContentParams {
  const { guestName, guestEmail, property, inspectionDate} = data;
  const isAdmin = !!data.isAdmin; // Convertir a booleano explícito

  // Si NO es admin (es guest), enviar correo sin enlace al PDF
  if (!isAdmin) {
    return {
      from: getDefaultSender(),
      to: [guestEmail!],
      subject: `Golf Cart Inspection Completed for ${property}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <img src="https://luxepropertiespr.com/wp-content/uploads/2024/09/LOGO.png" alt="Luxe Properties Logo" style="max-width: 200px; margin-bottom: 20px;">
          <h2 style="color: #2c5282; margin-bottom: 20px;">Inspection Completed</h2>
          <p style="margin-bottom: 15px;">Dear ${guestName},</p>
          <p style="margin-bottom: 20px;">Thank you for completing the inspection form for the golf cart at ${property}. Your submission has been received.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
            <p style="margin-bottom: 10px;"><strong>Property:</strong> ${property}</p>
            <p style="margin-bottom: 10px;"><strong>Inspection Date:</strong> ${inspectionDate}</p>
          </div>
          <p style="margin-top: 20px;">Have an amazing stay</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666;">Best regards,<br>Luxe Properties</p>
        </div>
      `,
    };
  } else {

    return {
      from: getDefaultSender(),
      to: getFormCompletedAdminEmails(),
      subject: `Admin Copy: Golf Cart Inspection Completed for ${property}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <img src="https://luxepropertiespr.com/wp-content/uploads/2024/09/LOGO.png" alt="Luxe Properties Logo" style="max-width: 200px; margin-bottom: 20px;">
          <h2 style="color: #2c5282; margin-bottom: 20px;">Inspection Completed</h2>
          <p>The guest <strong>${guestName}</strong> has completed the inspection form for <strong>${property}</strong>.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
            <p><strong>Property:</strong> ${property}</p>
            <p><strong>Inspection Date:</strong> ${inspectionDate}</p>
          </div>
          <p style="color: #666;">Luxe Properties</p>
        </div>
      `,
    };
  }
}
