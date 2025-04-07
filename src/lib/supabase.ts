import { createClient } from '@supabase/supabase-js';
import { Point } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function getCartDiagramUrl(filename: string): Promise<string | null> {
  try {
    console.log('Getting diagram URL for:', filename);
    const { data } = supabase
      .storage
      .from('diagrams')
      .getPublicUrl(filename);

    console.log('Got diagram URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting diagram URL:', error);
    return null;
  }
}

export async function saveDiagramMarks(diagramName: string, points: Point[]): Promise<void> {
  if (!diagramName || !points) {
    console.warn('Missing required parameters for saveDiagramMarks');
    return;
  }

  try {
    const { error } = await supabase
      .from('diagram_marks')
      .upsert(
        { 
          diagram_name: diagramName,
          points: points
        },
        { 
          onConflict: 'diagram_name'
        }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error saving diagram marks:', error);
    throw error;
  }
}

export async function uploadPDF(pdfBlob: Blob, filename: string): Promise<string | null> {
  try {
    const { error } = await supabase
      .storage
      .from('pdfs')
      .upload(filename, pdfBlob, {
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

export async function getDiagramMarks(diagramName: string): Promise<Point[]> {
  if (!diagramName) {
    console.warn('No diagram name provided to getDiagramMarks');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('diagram_marks')
      .select('points')
      .eq('diagram_name', diagramName)
      .maybeSingle();

    if (error) throw error;

    return data?.points || [];
  } catch (error) {
    console.error('Error getting diagram marks:', error);
    throw error;
  }
}