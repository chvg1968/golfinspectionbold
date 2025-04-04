/*
  # Fix inspection table RLS policies

  1. Changes
    - Drop existing overly permissive insert policy
    - Add new insert policy that properly handles guest access
    - Update select policy to use proper authentication check
  
  2. Security
    - Ensures guests can only create inspections with their own email
    - Maintains data isolation between different guests
*/

-- Drop the existing overly permissive insert policy
DROP POLICY IF EXISTS "Anyone can create inspections" ON inspections;

-- Drop the existing select policy
DROP POLICY IF EXISTS "Guests can read own inspections" ON inspections;

-- Create new insert policy that ensures guest can only create inspections with their own email
CREATE POLICY "Guests can create own inspections"
ON inspections
FOR INSERT
TO public
WITH CHECK (
  -- Ensure the guest_email matches the authenticated user's email
  auth.jwt()->>'email' = guest_email
);

-- Create new select policy that uses proper authentication check
CREATE POLICY "Guests can read own inspections"
ON inspections
FOR SELECT
TO public
USING (
  -- Ensure the guest_email matches the authenticated user's email
  auth.jwt()->>'email' = guest_email
);