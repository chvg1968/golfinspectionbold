// Tipos para el servicio de email
export interface EmailData {
  guestName: string;
  guestEmail: string;
  property: string;
  type?: 'guest-form' | 'completed-form';
  inspectionDate?: string;
  formLink?: string;
  replyTo?: string;
  subject?: string;
  pdfBase64?: string;
  
  // Campos adicionales para la inspección de carrito de golf
  cartType?: string;
  cartNumber?: string;
  damages?: string[];
  observations?: string;
  
  // Campos de firma y términos
  signatureBase64?: string;
  termsAccepted?: boolean;

  // Campos de diagrama
  diagramBase64?: string;
  diagramPoints?: Array<{
    x: number;
    y: number;
    color: string;
    size?: number;
  }>;
}

export interface InspectionData {
  cartType: string;
  cartNumber: string;
  observations: string;
  damages?: string[];
  signatureBase64?: string;
  termsAccepted?: boolean;
}

export interface EmailServiceParams extends EmailData {
  inspectionData?: InspectionData;
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