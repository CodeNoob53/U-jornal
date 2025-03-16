/*
  # University Journal System Initial Schema

  1. Tables
    - users
      - Basic user information and authentication
      - Roles: admin, teacher, student, parent
    - faculties
      - Faculty information
    - departments
      - Department information within faculties
    - degree_types
      - Bachelor, Master, etc.
    - student_groups
      - Student group information
    - students
      - Detailed student information
    - subjects
      - Course/subject information
    - grades
      - Student grades
    - attendance
      - Student attendance records
    
  2. Security
    - RLS enabled on all tables
    - Policies for different user roles
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE degree_type AS ENUM ('bachelor', 'master', 'phd');
CREATE TYPE attendance_status AS ENUM ('present', 'absent');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Faculties
CREATE TABLE faculties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES faculties(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student Groups
CREATE TABLE student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  name TEXT NOT NULL,
  degree_type degree_type NOT NULL,
  year_of_study INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES student_groups(id),
  student_id_number TEXT UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  max_points INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher-Subject assignments
CREATE TABLE teacher_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES users(id),
  subject_id UUID REFERENCES subjects(id),
  group_id UUID REFERENCES student_groups(id),
  semester INTEGER NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, subject_id, group_id, semester, academic_year)
);

-- Grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES users(id),
  points DECIMAL(5,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  subject_id UUID REFERENCES subjects(id),
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admin can manage all data
CREATE POLICY "Admins have full access" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other tables...
-- (Additional policies will be added in subsequent migrations)

-- Functions for statistics
CREATE OR REPLACE FUNCTION calculate_student_average(student_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT AVG(points)
    FROM grades
    WHERE student_id = student_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_group_average(group_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT AVG(points)
    FROM grades g
    JOIN students s ON s.id = g.student_id
    WHERE s.group_id = group_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;