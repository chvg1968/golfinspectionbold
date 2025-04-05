import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCartDiagramUrl(filename: string): Promise<string | null> {
  try {
    const { data } = supabase
      .storage
      .from('diagrams')
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting diagram URL:', error);
    return null;
  }
}

function sanitizeFileName(filename: string): string {
  // Reemplazar caracteres no permitidos con guiones
  return filename
    .replace(/[^a-zA-Z0-9-_.]/g, '-') // Solo permitir letras, números, guiones, puntos
    .replace(/--+/g, '-')              // Evitar guiones múltiples
    .toLowerCase();
}

export async function uploadPDF(blob: Blob, filename: string): Promise<string | null> {
  try {
    // Sanitizar nombre de archivo
    const safeFileName = sanitizeFileName(filename);
    
    // Intentar subir directamente al bucket pdfs
    const { error: uploadError } = await supabase
      .storage
      .from('pdfs')
      .upload(`${safeFileName}`, blob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Obtener URL pública directamente de Supabase
    const { data: urlData } = supabase
      .storage
      .from('pdfs')
      .getPublicUrl(safeFileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error; // Propagar el error para mejor manejo
  }
}
