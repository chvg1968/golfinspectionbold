import { supabase } from './supabase';
import { Point } from '../types';

export async function saveDiagramMarks(diagramName: string, points: Point[]): Promise<void> {
  try {
    // Normalizar el nombre del diagrama (eliminar extensión si existe)
    const normalizedName = diagramName.replace(/\.jpg$/, '');

    // Primero, buscar si ya existen marcas para este diagrama
    const { data: existingMarks, error: selectError } = await supabase
      .from('diagram_marks')
      .select('id')
      .eq('diagram_name', normalizedName)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing marks:', selectError);
      return;
    }

    if (existingMarks) {
      // Si existen, actualizar
      const { error: updateError } = await supabase
        .from('diagram_marks')
        .update({
          points,
          updated_at: new Date().toISOString()
        })
        .eq('diagram_name', normalizedName);
      if (updateError) {
        console.error('Error updating marks:', updateError);
        return;
      }
    } else {
      // Si no existen, crear nuevo registro
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
      .maybeSingle();

    if (error) {
      console.error('Error getting diagram marks:', error);
      return [];
    }

    return data?.points || [];
  } catch (error) {
    console.error('Error getting diagram marks:', error);
    return [];
  }
}
