/*
  # Create inspections schema

  1. New Tables
    - `inspections`
      - `id` (uuid, primary key)
      - `guest_name` (text)
      - `guest_email` (text)
      - `guest_phone` (text)
      - `inspection_date` (date)
      - `property` (text)
      - `cart_type` (text)
      - `cart_number` (text)
      - `observations` (text)
      - `diagram_data` (jsonb)
      - `signature_data` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on `inspections` table
    - Add policy for public access to create inspections
    - Add policy for reading own inspections
*/

CREATE TABLE inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text NOT NULL,
  inspection_date date NOT NULL,
  property text NOT NULL,
  cart_type text NOT NULL,
  cart_number text NOT NULL,
  observations text,
  diagram_data jsonb,
  signature_data text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a new inspection
CREATE POLICY "Anyone can create inspections"
  ON inspections
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow reading inspections by guest email
CREATE POLICY "Guests can read own inspections"
  ON inspections
  FOR SELECT
  TO public
  USING (guest_email = current_user);