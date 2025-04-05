import { supabase } from './supabase';
import { Point } from '../types';

export async function saveDiagramMarks(diagramName: string, points: Point[]): Promise<void> {
  try {
    // Normalizar el nombre del diagrama (eliminar extensión si existe)
    const normalizedName = diagramName.replace(/\.jpg$/, '');

    // Primero, eliminar cualquier registro existente para este diagrama
    const { error: deleteError } = await supabase
      .from('diagram_marks')
      .delete()
      .eq('diagram_name', normalizedName);

    if (deleteError) {
      console.error('Error deleting existing marks:', deleteError);
      return;
    }

    // Crear nuevo registro
    const { error: insertError } = await supabase
      .from('diagram_marks')
      .insert({
        diagram_name: normalizedName,
        points,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    if (insertError) {
      console.error('Error inserting marks:', insertError);
      return;
    }
  } catch (error) {
    console.error('Error saving diagram marks:', error);
  }
}

export async function getDiagramMarks(diagramName: string): Promise<Point[]> {
  try {
    // Normalizar el nombre del diagrama (eliminar extensión si existe)
    const normalizedName = diagramName.replace(/\.jpg$/, '');

    const { data, error } = await supabase
      .from('diagram_marks')
      .select('points')
      .eq('diagram_name', normalizedName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No hay marcas para este diagrama
        return [];
      }
      console.error('Error getting diagram marks:', error);
      return [];
    }

    return data?.points || [];
  } catch (error) {
    console.error('Error getting diagram marks:', error);
    return [];
  }
}
