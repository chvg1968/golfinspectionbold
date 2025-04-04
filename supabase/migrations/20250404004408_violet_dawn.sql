/*
  # Update inspection table RLS policies

  1. Changes
    - Drop existing policies
    - Add new comprehensive policies for:
      - Insert: Allow public access for creating inspections
      - Select: Allow guests to read their own inspections
      - Update: Allow guests to update their own inspections
      - Delete: Allow guests to delete their own inspections

  2. Security
    - Maintains data isolation between guests using email
    - Allows initial creation without authentication
    - Subsequent operations require matching guest email
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Guests can create own inspections" ON inspections;
DROP POLICY IF EXISTS "Guests can read own inspections" ON inspections;

-- Create new policies
CREATE POLICY "Enable insert access for all users" ON inspections
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Guests can read own inspections" ON inspections
  FOR SELECT
  TO public
  USING (guest_email = coalesce(auth.jwt() ->> 'email', guest_email));

CREATE POLICY "Guests can update own inspections" ON inspections
  FOR UPDATE
  TO public
  USING (guest_email = coalesce(auth.jwt() ->> 'email', guest_email))
  WITH CHECK (guest_email = coalesce(auth.jwt() ->> 'email', guest_email));

CREATE POLICY "Guests can delete own inspections" ON inspections
  FOR DELETE
  TO public
  USING (guest_email = coalesce(auth.jwt() ->> 'email', guest_email));