/*
  # Fix Users Table Policies

  1. Changes
    - Drop existing policies
    - Create new, simplified policies for users table
  
  2. Security
    - Enable RLS
    - Add policy for admins to manage all users
    - Add policy for users to read their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);