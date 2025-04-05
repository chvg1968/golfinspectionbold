import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

<<<<<<< HEAD
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
=======
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
>>>>>>> f0b21650ba5eb0efc04b5981ca6969c441ed5566
