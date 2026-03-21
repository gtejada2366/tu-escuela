-- ============================================================
-- Migration: Multi-tenancy support
-- Adds school_id to all tables for tenant isolation via RLS
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Create schools table
-- ============================================================
CREATE TABLE schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  tagline     TEXT DEFAULT 'Sistema de Gestión Escolar',
  logo_url    TEXT DEFAULT '',
  slug        TEXT UNIQUE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  plan        TEXT NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico', 'pro')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON schools
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Create a default school for existing data
-- ============================================================
INSERT INTO schools (name, slug, status)
VALUES ('Mi Colegio', 'mi-colegio', 'active');

-- 3. Helper: get current user's school_id
-- ============================================================
CREATE OR REPLACE FUNCTION current_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Add school_id to all tables (nullable first for migration)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE grades ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE message_recipients ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE message_attachments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE homework ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

-- 5. Backfill existing rows with the default school
-- ============================================================
DO $$
DECLARE v_school_id UUID;
BEGIN
  SELECT id INTO v_school_id FROM schools LIMIT 1;
  UPDATE profiles SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE academic_years SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE students SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE classes SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE enrollments SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE attendance SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE grades SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE payments SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE messages SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE message_recipients SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE message_attachments SET school_id = v_school_id WHERE school_id IS NULL;
  UPDATE homework SET school_id = v_school_id WHERE school_id IS NULL;
END $$;

-- 6. Make NOT NULL
-- ============================================================
ALTER TABLE profiles ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE academic_years ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE classes ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE enrollments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE attendance ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE grades ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE message_recipients ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE message_attachments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE homework ALTER COLUMN school_id SET NOT NULL;

-- 7. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_ay_school ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school ON enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_school ON grades(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_school ON payments(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_school ON messages(school_id);
CREATE INDEX IF NOT EXISTS idx_mr_school ON message_recipients(school_id);
CREATE INDEX IF NOT EXISTS idx_ma_school ON message_attachments(school_id);
CREATE INDEX IF NOT EXISTS idx_homework_school ON homework(school_id);

-- 8. Auto-fill trigger: sets school_id on INSERT from current user
-- ============================================================
CREATE OR REPLACE FUNCTION set_school_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    NEW.school_id := current_school_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_set_school_id BEFORE INSERT ON academic_years FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON students FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON classes FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON enrollments FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON attendance FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON grades FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON messages FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON message_recipients FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON message_attachments FOR EACH ROW EXECUTE FUNCTION set_school_id();
CREATE TRIGGER auto_set_school_id BEFORE INSERT ON homework FOR EACH ROW EXECUTE FUNCTION set_school_id();

-- 9. Update helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION is_teacher_of_class(p_class_id INTEGER)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id
      AND teacher_id = auth.uid()
      AND school_id = current_school_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 10. Drop ALL old RLS policies and create new ones with school_id
-- ============================================================

-- SCHOOLS
CREATE POLICY "Schools: read own" ON schools FOR SELECT USING (
  id = current_school_id()
);
CREATE POLICY "Schools: director updates" ON schools FOR UPDATE USING (
  id = current_school_id() AND is_director()
);

-- PROFILES
DROP POLICY IF EXISTS "Profiles: read all" ON profiles;
DROP POLICY IF EXISTS "Profiles: director manages" ON profiles;
DROP POLICY IF EXISTS "Profiles: update own" ON profiles;

CREATE POLICY "Profiles: read school" ON profiles FOR SELECT USING (
  school_id = current_school_id()
);
CREATE POLICY "Profiles: director manages" ON profiles FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE USING (
  id = auth.uid() AND school_id = current_school_id()
);

-- ACADEMIC YEARS
DROP POLICY IF EXISTS "AY: read" ON academic_years;
DROP POLICY IF EXISTS "AY: director manages" ON academic_years;

CREATE POLICY "AY: read" ON academic_years FOR SELECT USING (
  school_id = current_school_id()
);
CREATE POLICY "AY: director manages" ON academic_years FOR ALL USING (
  school_id = current_school_id() AND is_director()
);

-- STUDENTS
DROP POLICY IF EXISTS "Students: director full" ON students;
DROP POLICY IF EXISTS "Students: profesor reads own" ON students;

CREATE POLICY "Students: director full" ON students FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Students: profesor reads own" ON students FOR SELECT USING (
  school_id = current_school_id() AND
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = students.id AND c.teacher_id = auth.uid()
  )
);

-- CLASSES
DROP POLICY IF EXISTS "Classes: director full" ON classes;
DROP POLICY IF EXISTS "Classes: profesor reads own" ON classes;
DROP POLICY IF EXISTS "Classes: profesor updates own" ON classes;

CREATE POLICY "Classes: director full" ON classes FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Classes: profesor reads own" ON classes FOR SELECT USING (
  school_id = current_school_id() AND teacher_id = auth.uid()
);
CREATE POLICY "Classes: profesor updates own" ON classes FOR UPDATE USING (
  school_id = current_school_id() AND teacher_id = auth.uid()
);

-- ENROLLMENTS
DROP POLICY IF EXISTS "Enrollments: director full" ON enrollments;
DROP POLICY IF EXISTS "Enrollments: profesor reads own" ON enrollments;

CREATE POLICY "Enrollments: director full" ON enrollments FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Enrollments: profesor reads own" ON enrollments FOR SELECT USING (
  school_id = current_school_id() AND is_teacher_of_class(class_id)
);

-- ATTENDANCE
DROP POLICY IF EXISTS "Attendance: director full" ON attendance;
DROP POLICY IF EXISTS "Attendance: profesor manages own" ON attendance;

CREATE POLICY "Attendance: director full" ON attendance FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Attendance: profesor manages own" ON attendance FOR ALL USING (
  school_id = current_school_id() AND is_teacher_of_class(class_id)
);

-- GRADES
DROP POLICY IF EXISTS "Grades: director full" ON grades;
DROP POLICY IF EXISTS "Grades: profesor manages own" ON grades;

CREATE POLICY "Grades: director full" ON grades FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Grades: profesor manages own" ON grades FOR ALL USING (
  school_id = current_school_id() AND is_teacher_of_class(class_id)
);

-- PAYMENTS
DROP POLICY IF EXISTS "Payments: director full" ON payments;
DROP POLICY IF EXISTS "Payments: parent reads own" ON payments;

CREATE POLICY "Payments: director full" ON payments FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Payments: parent reads own" ON payments FOR SELECT USING (
  school_id = current_school_id() AND
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = payments.student_id
    AND s.parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);

-- HOMEWORK
DROP POLICY IF EXISTS "Homework: director full" ON homework;
DROP POLICY IF EXISTS "Homework: profesor manages own" ON homework;

CREATE POLICY "Homework: director full" ON homework FOR ALL USING (
  school_id = current_school_id() AND is_director()
);
CREATE POLICY "Homework: profesor manages own" ON homework FOR ALL USING (
  school_id = current_school_id() AND is_teacher_of_class(class_id)
);

-- MESSAGES
DROP POLICY IF EXISTS "Messages: read own" ON messages;
DROP POLICY IF EXISTS "Messages: insert own" ON messages;

CREATE POLICY "Messages: read own" ON messages FOR SELECT USING (
  school_id = current_school_id() AND (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM message_recipients mr WHERE mr.message_id = messages.id AND mr.recipient_id = auth.uid()
    ) OR
    is_director()
  )
);
CREATE POLICY "Messages: insert own" ON messages FOR INSERT WITH CHECK (
  school_id = current_school_id() AND sender_id = auth.uid()
);

-- MESSAGE RECIPIENTS
DROP POLICY IF EXISTS "MR: read own" ON message_recipients;
DROP POLICY IF EXISTS "MR: insert" ON message_recipients;
DROP POLICY IF EXISTS "MR: update read" ON message_recipients;

CREATE POLICY "MR: read own" ON message_recipients FOR SELECT USING (
  school_id = current_school_id() AND (
    recipient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM messages m WHERE m.id = message_id AND m.sender_id = auth.uid()) OR
    is_director()
  )
);
CREATE POLICY "MR: insert" ON message_recipients FOR INSERT WITH CHECK (
  school_id = current_school_id() AND
  EXISTS (SELECT 1 FROM messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
);
CREATE POLICY "MR: update read" ON message_recipients FOR UPDATE USING (
  school_id = current_school_id() AND recipient_id = auth.uid()
);

-- MESSAGE ATTACHMENTS
DROP POLICY IF EXISTS "MA: read" ON message_attachments;
DROP POLICY IF EXISTS "MA: insert" ON message_attachments;

CREATE POLICY "MA: read" ON message_attachments FOR SELECT USING (
  school_id = current_school_id() AND
  EXISTS (
    SELECT 1 FROM messages m WHERE m.id = message_id AND (
      m.sender_id = auth.uid() OR
      EXISTS (SELECT 1 FROM message_recipients mr WHERE mr.message_id = m.id AND mr.recipient_id = auth.uid()) OR
      is_director()
    )
  )
);
CREATE POLICY "MA: insert" ON message_attachments FOR INSERT WITH CHECK (
  school_id = current_school_id() AND
  EXISTS (SELECT 1 FROM messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
);

-- 11. Update handle_new_user trigger to include school_id
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role, avatar, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'profesor'),
    COALESCE(NEW.raw_user_meta_data->>'avatar',
      UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))),
    (NEW.raw_user_meta_data->>'school_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
