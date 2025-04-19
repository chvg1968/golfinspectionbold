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
}

// Tipo para el contenido del correo
export interface EmailContentParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string;
  }[];
}
