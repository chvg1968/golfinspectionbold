// Tipos para el servicio de email
export interface EmailData {
  guestName?: string;
  guestEmail?: string;
  property: string;
  type?: 'guest-form' | 'completed-form';
  inspectionDate?: string;
  formLink?: string;
  formLinkWithDomain?: string;
  formId?: string;
  replyTo?: string;
  subject?: string;
  pdfBase64?: string;
  pdf_attachment?: string;
  pdfUrl?: string;
  cartType?: string;
  cartNumber?: string;
  observations?: string;
  signatureBase64?: string;
  termsAccepted?: boolean;
  diagramBase64?: string;
  diagramPoints?: Array<{
    x: number;
    y: number;
    color: string;
    size?: number;
  }>;
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
  to_name?: string;
  to_email?: string;
  from_name?: string;
  from_email?: string;
  property: string;
  type?: 'guest-form' | 'completed-form';
  cart_type?: string;
  cart_number?: string;
  inspection_date?: string;
  form_link?: string;
  pdf_attachment?: string;
  reply_to?: string;
  subject?: string;
  observations?: string;
  signatureBase64?: string;
  termsAccepted?: boolean;
  diagramBase64?: string;
  diagramPoints?: Array<{
    x: number;
    y: number;
    color: string;
    size?: number;
  }>;
  formId?: string;
  isAdmin?: boolean;
}

// Tipo para el contenido del correo
export interface EmailContentParams {
  from: string;
  to: string[];
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}