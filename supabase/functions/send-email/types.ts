export interface InspectionData {
  cartType: string;
  cartNumber: string;
  observations: string;
}

export interface EmailData {
  guestName: string;
  guestEmail: string;
  property: string;
  inspectionDate?: string;
  formLink?: string;
  inspectionData?: InspectionData;
  pdfBase64?: string;
}