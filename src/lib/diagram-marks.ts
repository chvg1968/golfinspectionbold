import { supabase } from './supabase';
import { Point } from '../types';

interface DiagramMarks {
  id?: string;
  diagram_name: string;
  points: Point[];
  created_at?: string;
  updated_at?: string;
}

export async function saveDiagramMarks(diagramName: string, points: Point[]): Promise<void> {
  try {
    // Primero, buscar si ya existen marcas para este diagrama
    const { data: existingMarks } = await supabase
      .from('diagram_marks')
      .select()
      .eq('diagram_name', diagramName)
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
          diagram_name: diagramName,
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
    const { data } = await supabase
      .from('diagram_marks')
      .select('points')
      .eq('diagram_name', diagramName)
      .single();

    return data?.points || [];
  } catch (error) {
    console.error('Error getting diagram marks:', error);
    return [];
  }
}
