// Configuración centralizada para el servicio de correo electrónico

// Listas diferenciadas de correos de administradores

// Lista para alertas de formulario creado
export const FORM_CREATED_ADMIN_EMAILS = [
  "hernancalendar01@gmail.com",
  "luxeprbahia@gmail.com"
];

// Lista para notificaciones de formulario completado/firmado
export const FORM_COMPLETED_ADMIN_EMAILS = [
  "conradovilla@hotmail.com",
  "luxeprbahia@gmail.com"
];

// Lista general de administradores (para compatibilidad con código existente)
export const ADMIN_EMAILS = [
  ...new Set([...FORM_CREATED_ADMIN_EMAILS, ...FORM_COMPLETED_ADMIN_EMAILS])
];

// Correo de remitente predeterminado
export const DEFAULT_SENDER = "Luxe Properties <noreply@luxepropertiespr.com>";

// Correo de soporte
export const SUPPORT_EMAIL = "support@luxepropertiespr.com";

// Configuración de URLs
export const URLS = {
  baseUrl: "https://golf-cart-inspection.netlify.app",
  supabaseProjectId: "lngsgyvpqhjmedjrycqw"
};

// Funciones para obtener las listas de administradores

// Función para obtener la lista general de administradores
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS]; // Devuelve una copia para evitar modificaciones accidentales
}

// Función para obtener la lista de administradores para alertas de formulario creado
export function getFormCreatedAdminEmails(): string[] {
  return [...FORM_CREATED_ADMIN_EMAILS];
}

// Función para obtener la lista de administradores para notificaciones de formulario completado
export function getFormCompletedAdminEmails(): string[] {
  return [...FORM_COMPLETED_ADMIN_EMAILS];
}

// Función para obtener el remitente predeterminado
export function getDefaultSender(): string {
  return DEFAULT_SENDER;
}

// Función para generar URL de PDF en Supabase
export function generatePdfUrl(formId: string, dateStr: string): string {
  return `https://${URLS.supabaseProjectId}.supabase.co/storage/v1/object/public/pdfs/${formId}_${dateStr}.pdf`;
}
