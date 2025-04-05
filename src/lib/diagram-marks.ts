import { supabase } from './supabase';
import { Point } from '../types';

export async function saveDiagramMarks(diagramName: string, points: Point[]): Promise<void> {
  try {
    // Normalizar el nombre del diagrama (eliminar extensión si existe)
    const normalizedName = diagramName.replace(/\.jpg$/, '');

    // Primero, buscar si ya existen marcas para este diagrama
    const { data: existingMarks } = await supabase
      .from('diagram_marks')
      .select('*')
      .eq('diagram_name', normalizedName)
      .single();

    if (existingMarks) {
      // Si existen, actualizar
      await supabase
        .from('diagram_marks')
        .update({
          points,
          updated_at: new Date().toISOString()
        })
        .eq('diagram_name', diagramName);
    } else {
      // Si no existen, crear nuevo registro
      await supabase
        .from('diagram_marks')
        .insert({
          diagram_name: normalizedName,
          points,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error saving diagram marks:', error);
    throw error;
  }
}

export async function getDiagramMarks(diagramName: string): Promise<Point[]> {
  try {
    // Normalizar el nombre del diagrama (eliminar extensión si existe)
    const normalizedName = diagramName.replace(/\.jpg$/, '');

    const { data } = await supabase
      .from('diagram_marks')
      .select('points')
      .eq('diagram_name', normalizedName)
      .single();

    return data?.points || [];
  } catch (error) {
    console.error('Error getting diagram marks:', error);
    return [];
  }
}
