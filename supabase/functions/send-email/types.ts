// Tipos para el servicio de email
export interface EmailData {
  guestName?: string;
  guestEmail?: string;
  property?: string;
  type?: string;
  inspectionDate?: string;
  formLink?: string;
  formLinkWithDomain?: string;
  formId?: string;
  replyTo?: string;
  subject?: string;
  pdfUrl?: string;
  pdf_attachment?: string;
  pdfBase64?: string;
  cartType?: string;
  cartNumber?: string;
  observations?: string;
  signatureBase64?: string;
  termsAccepted?: boolean;
  diagramBase64?: string;
  diagramPoints?: any[];
  adminEmails?: string[];
  isAdmin?: boolean;
  adminAlert?: boolean; // Indica si este correo es una alerta para administradores
  skipAdminAlert?: boolean; // Indica si se debe omitir el envío automático de alertas a administradores
}

export interface InspectionData {
  cartType: string;
  cartNumber: string;
  observations: string;
  signatureBase64?: string;
  termsAccepted?: boolean;
}

export interface EmailServiceParams {
  to_email?: string;
  to_name?: string;
  from_name?: string;
  from_email?: string;
  property?: string;
  type?: string;
  inspection_date?: string;
  form_link?: string;
  formId?: string;
  reply_to?: string;
  subject?: string;
  pdf_attachment?: string;
  cart_type?: string;
  cart_number?: string;
  observations?: string;
  signatureBase64?: string;
  termsAccepted?: boolean;
  diagramBase64?: string;
  diagramPoints?: any[];
  isAdmin?: boolean;
  skipAdminAlert?: boolean; // Indica si se debe omitir el envío automático de alertas a administradores
}

// Tipo para el contenido del correo (compatible directamente con la API de Resend)
export interface EmailContentParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string;
  }[];
  // Campos adicionales para la API de Resend
  reply_to?: string;
  cc?: string | string[];
  bcc?: string | string[];
  // Metadatos para uso interno
  type?: 'guest-form' | 'completed-form' | 'admin-alert';
}
