/*
  # Create storage policies for diagrams bucket

  1. Changes
    - Enable public read access to diagrams bucket
    - Restrict write operations to authenticated users only
    - Add specific policies for diagram access

  2. Security
    - Allow anyone to read diagram files
    - Only allow authenticated users to upload/modify diagrams
    - Prevent unauthorized modifications
*/

-- Habilitar el acceso público para lectura de diagramas
CREATE POLICY "Permitir acceso público para lectura de diagramas"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'diagrams' AND
  (storage.foldername(name))[1] = 'diagrams'
);

-- Permitir a usuarios autenticados subir diagramas
CREATE POLICY "Permitir a usuarios autenticados subir diagramas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diagrams' AND
  (storage.foldername(name))[1] = 'diagrams' AND
  (LOWER(RIGHT(name, 4)) = '.jpg' OR LOWER(RIGHT(name, 4)) = '.png')
);

-- Permitir a usuarios autenticados actualizar diagramas
CREATE POLICY "Permitir a usuarios autenticados actualizar diagramas"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'diagrams' AND
  (storage.foldername(name))[1] = 'diagrams'
)
WITH CHECK (
  bucket_id = 'diagrams' AND
  (storage.foldername(name))[1] = 'diagrams' AND
  (LOWER(RIGHT(name, 4)) = '.jpg' OR LOWER(RIGHT(name, 4)) = '.png')
);

-- Permitir a usuarios autenticados eliminar diagramas
CREATE POLICY "Permitir a usuarios autenticados eliminar diagramas"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'diagrams' AND
  (storage.foldername(name))[1] = 'diagrams'
);