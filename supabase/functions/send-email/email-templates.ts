import { EmailData, EmailContentParams } from "./types.ts";

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
    from: "Luxe Properties <noreply@luxepropertiespr.com>",
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
  const { guestName, property, inspectionDate, adminEmails } = data;

  return {
    from: "Luxe Properties <noreply@luxepropertiespr.com>",
    to: Array.isArray(adminEmails)
      ? adminEmails.filter((e): e is string => !!e)
      : [],
    subject: `Alert: New form has been created for ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3>New inspection form created</h3>
        <p>A new inspection form has been created for the property <strong>${property}</strong>.</p>
        <p><strong>Guest Name:</strong> ${guestName || "N/A"}</p>
        <p><strong>Guest Email:</strong> ${data.guestEmail || "N/A"}</p>
        <p><strong>Inspection Date:</strong> ${inspectionDate}</p>
        <p style="margin-bottom: 10px;">To access the inspection form, copy and paste this link into your browser:</p>
        ${
          data.formLinkWithDomain || data.formLink
            ? `<p style='margin-bottom: 20px; word-break: break-all; color: #4a5568;'>${
                data.formLinkWithDomain || data.formLink
              }</p>`
            : `<p style='margin-bottom: 20px; color: #e53e3e;'>No valid inspection form link available. Please contact support.</p>`
        }
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
    formId,
  } = data;
  // Priorizar pdf_attachment (Supabase pdfs bucket), si no existe usar pdfUrl

  // Construir URL de Supabase PDFs bucket si no existe
  const supabaseProjectId = 'lngsgyvpqhjmedjrycqw'; // Reemplazar con variable de entorno
  const pdfFileName = `rental_${formId}_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfLink = data.pdf_attachment || 
    (formId ? `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/pdfs/${pdfFileName}` : data.pdfUrl);

  return {
    from: "Luxe Properties <noreply@luxepropertiespr.com>",
    to: ["hernancalendar01@gmail.com", "luxeprbahia@gmail.com"].filter(
      (e): e is string => !!e
    ),
    subject: `Inspection Form Signed - ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Inspection Form Signed</h2>
        <p>The guest <strong>${guestName}</strong> (${guestEmail}) has signed and completed the inspection form for <strong>${property}</strong>.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p><strong>Guest Name:</strong> ${guestName || "N/A"}</p>
<p><strong>Guest Email:</strong> ${guestEmail || "N/A"}</p>
<p><strong>Inspection Date:</strong> ${data.inspectionDate || "N/A"}</p>
<p><strong>Property:</strong> ${property}</p>
          <p><strong>Cart Type:</strong> ${cartType}</p>
          <p><strong>Cart Number:</strong> ${cartNumber}</p>
          <p><strong>Observations:</strong> ${
            observations || "No observations provided"
          }</p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          ${pdfLink
            ? `<a href="${pdfLink}" style="background-color: #3182ce; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Descargar PDF firmado</a>`
            : `<span style='color: #e53e3e;'>No valid PDF link available. Please contact support.</span>`
          }
        </div>
        <p style="margin-top: 20px;">También puedes encontrar el PDF firmado adjunto a este correo.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666;">Golf Cart Inspection System</p>
      </div>
    `,
    attachments:
      typeof data.pdf_attachment === "string" && data.pdf_attachment
        ? [
            {
              filename: `inspection_${formId || "signed"}.pdf`,
              content: data.pdf_attachment,
            },
          ]
        : typeof data.pdfUrl === "string" && data.pdfUrl
        ? [
            {
              filename: `inspection_${formId || "signed"}.pdf`,
              content: data.pdfUrl,
            },
          ]
        : undefined,
  };
}

// Función generadora para el evento CONFIRMACION (correo al guest confirmando que firmó)
export function generarContenidoConfirmacion(
  data: EmailData
): EmailContentParams {
  const { guestName, guestEmail, property, inspectionDate, formId } = data;

  // Construir URL de Supabase PDFs bucket si no existe
  const supabaseProjectId = 'lngsgyvpqhjmedjrycqw'; // Reemplazar con variable de entorno
  const pdfFileName = `rental_${formId}_${new Date().toISOString().split('T')[0]}.pdf`;
  const pdfLink = data.pdf_attachment || 
    (formId ? `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/pdfs/${pdfFileName}` : data.pdfUrl);

  return {
    from: "Luxe Properties <noreply@luxepropertiespr.com>",
    to: [guestEmail!],
    subject: `Golf Cart Inspection Completed for ${property}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5282; margin-bottom: 20px;">Inspection Completed</h2>
        <p style="margin-bottom: 15px;">Dear ${guestName},</p>
        <p style="margin-bottom: 20px;">Thank you for completing the inspection form for the golf cart at ${property}. Your submission has been received.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
          <p style="margin-bottom: 10px;"><strong>Property:</strong> ${property}</p>
          <p style="margin-bottom: 10px;"><strong>Inspection Date:</strong> ${inspectionDate}</p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          ${pdfLink
            ? `<a href='${pdfLink}' style='background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;'>Ver PDF firmado</a>`
            : (data.formLinkWithDomain || data.formLink)
            ? `<a href='${data.formLinkWithDomain || data.formLink}' style='background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;'>Revisar y Firmar Formulario</a>`
            : `<span style='color: #e53e3e;'>No valid PDF or form link available. Please contact support.</span>`
          }
        </div>
        <p style="margin-bottom: 10px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        ${
          data.formLinkWithDomain || data.formLink
            ? `<p style='margin-bottom: 20px; word-break: break-all; color: #4a5568;'>${
                data.formLinkWithDomain || data.formLink
              }</p>`
            : `<p style='margin-bottom: 20px; color: #e53e3e;'>No valid inspection form link available. Please contact support.</p>`
        }
        <p style="margin-top: 20px;">Thank you for your collaboration.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666;">Golf Cart Inspection System</p>
      </div>
    `,
  };
}