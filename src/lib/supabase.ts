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

export async function uploadPDF(blob: Blob, filename: string): Promise<string | null> {
  try {
    const { error } = await supabase
      .storage
      .from('pdfs')
      .upload(filename, blob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase
      .storage
      .from('pdfs')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }
}
