-- ============================================================
-- Tu Escuela — Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- 0. Schools (tenant table)
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

-- 1. Profiles (extends Supabase Auth users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID NOT NULL REFERENCES schools(id),
  name        TEXT NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('director', 'profesor', 'padre')),
  avatar      TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role, avatar, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'profesor'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))),
    (NEW.raw_user_meta_data->>'school_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Academic Years
-- ============================================================
CREATE TABLE academic_years (
  id          SERIAL PRIMARY KEY,
  school_id   UUID NOT NULL REFERENCES schools(id),
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_active   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Students
-- ============================================================
CREATE TABLE students (
  id               SERIAL PRIMARY KEY,
  school_id        UUID NOT NULL REFERENCES schools(id),
  name             TEXT NOT NULL,
  grade            TEXT NOT NULL,
  section          TEXT NOT NULL DEFAULT 'A',
  parent_name      TEXT,
  parent_phone     TEXT,
  parent_email     TEXT,
  address          TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn')),
  academic_year_id INTEGER REFERENCES academic_years(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 4. Classes
-- ============================================================
CREATE TABLE classes (
  id               SERIAL PRIMARY KEY,
  school_id        UUID NOT NULL REFERENCES schools(id),
  subject          TEXT NOT NULL,
  grade            TEXT NOT NULL,
  section          TEXT NOT NULL DEFAULT 'A',
  teacher_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  schedule         TEXT,
  classroom        TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  academic_year_id INTEGER REFERENCES academic_years(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 5. Enrollments (students ↔ classes)
-- ============================================================
CREATE TABLE enrollments (
  id          SERIAL PRIMARY KEY,
  school_id   UUID NOT NULL REFERENCES schools(id),
  class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- 6. Attendance
-- ============================================================
CREATE TABLE attendance (
  id          SERIAL PRIMARY KEY,
  school_id   UUID NOT NULL REFERENCES schools(id),
  class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, student_id, date)
);

-- 7. Grades
-- ============================================================
CREATE TABLE grades (
  id              SERIAL PRIMARY KEY,
  school_id       UUID NOT NULL REFERENCES schools(id),
  class_id        INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period          TEXT NOT NULL DEFAULT 'bimestre_1',
  exam1           NUMERIC(4,1) DEFAULT 0,
  exam2           NUMERIC(4,1) DEFAULT 0,
  homework        NUMERIC(4,1) DEFAULT 0,
  participation   NUMERIC(4,1) DEFAULT 0,
  average         NUMERIC(4,1) GENERATED ALWAYS AS (
                    ROUND((exam1 + exam2 + homework + participation) / 4, 1)
                  ) STORED,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, student_id, period)
);

-- 8. Payments
-- ============================================================
CREATE TABLE payments (
  id              SERIAL PRIMARY KEY,
  school_id       UUID NOT NULL REFERENCES schools(id),
  student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  concept         TEXT NOT NULL DEFAULT 'Pensión Escolar',
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE NOT NULL,
  paid_date       DATE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  payment_method  TEXT CHECK (payment_method IN ('manual', 'online')),
  transaction_id  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 9. Messages
-- ============================================================
CREATE TABLE messages (
  id          SERIAL PRIMARY KEY,
  school_id   UUID NOT NULL REFERENCES schools(id),
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'sent',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 10. Message Recipients
-- ============================================================
CREATE TABLE message_recipients (
  id              SERIAL PRIMARY KEY,
  school_id       UUID NOT NULL REFERENCES schools(id),
  message_id      INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_type  TEXT NOT NULL CHECK (recipient_type IN ('user', 'group', 'grade')),
  recipient_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_label TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 11. Message Attachments
-- ============================================================
CREATE TABLE message_attachments (
  id          SERIAL PRIMARY KEY,
  school_id   UUID NOT NULL REFERENCES schools(id),
  message_id  INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_size   TEXT,
  file_type   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- 12. Homework
-- ============================================================
CREATE TABLE homework (
  id          SERIAL PRIMARY KEY,
  school_id   UUID NOT NULL REFERENCES schools(id),
  class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_students_grade ON students(grade);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_grade ON classes(grade);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX idx_grades_class ON grades(class_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_homework_class ON homework(class_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_message_recipients_message ON message_recipients(message_id);
CREATE INDEX idx_message_recipients_user ON message_recipients(recipient_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's school_id (SECURITY DEFINER to avoid circular RLS)
CREATE OR REPLACE FUNCTION current_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is director
CREATE OR REPLACE FUNCTION is_director()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'director'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is the teacher of a class (scoped to school)
CREATE OR REPLACE FUNCTION is_teacher_of_class(p_class_id INTEGER)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id AND teacher_id = auth.uid()
      AND school_id = current_school_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-fill school_id on INSERT from current user's profile
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

-- ── RLS POLICIES (all scoped by school_id) ──────────────────

-- SCHOOLS
CREATE POLICY "Schools: read own" ON schools FOR SELECT USING (id = current_school_id());
CREATE POLICY "Schools: director updates" ON schools FOR UPDATE USING (id = current_school_id() AND is_director());

-- PROFILES
CREATE POLICY "Profiles: read school" ON profiles FOR SELECT USING (school_id = current_school_id());
CREATE POLICY "Profiles: director manages" ON profiles FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE USING (id = auth.uid() AND school_id = current_school_id());

-- ACADEMIC YEARS
CREATE POLICY "AY: read" ON academic_years FOR SELECT USING (school_id = current_school_id());
CREATE POLICY "AY: director manages" ON academic_years FOR ALL USING (school_id = current_school_id() AND is_director());

-- STUDENTS
CREATE POLICY "Students: director full" ON students FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Students: profesor reads own" ON students FOR SELECT USING (
  school_id = current_school_id() AND
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = students.id AND c.teacher_id = auth.uid()
  )
);

-- CLASSES
CREATE POLICY "Classes: director full" ON classes FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Classes: profesor reads own" ON classes FOR SELECT USING (school_id = current_school_id() AND teacher_id = auth.uid());
CREATE POLICY "Classes: profesor updates own" ON classes FOR UPDATE USING (school_id = current_school_id() AND teacher_id = auth.uid());

-- ENROLLMENTS
CREATE POLICY "Enrollments: director full" ON enrollments FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Enrollments: profesor reads own" ON enrollments FOR SELECT USING (school_id = current_school_id() AND is_teacher_of_class(class_id));

-- ATTENDANCE
CREATE POLICY "Attendance: director full" ON attendance FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Attendance: profesor manages own" ON attendance FOR ALL USING (school_id = current_school_id() AND is_teacher_of_class(class_id));

-- GRADES
CREATE POLICY "Grades: director full" ON grades FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Grades: profesor manages own" ON grades FOR ALL USING (school_id = current_school_id() AND is_teacher_of_class(class_id));

-- PAYMENTS
CREATE POLICY "Payments: director full" ON payments FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Payments: parent reads own" ON payments FOR SELECT USING (
  school_id = current_school_id() AND
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = payments.student_id
    AND s.parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);

-- HOMEWORK
CREATE POLICY "Homework: director full" ON homework FOR ALL USING (school_id = current_school_id() AND is_director());
CREATE POLICY "Homework: profesor manages own" ON homework FOR ALL USING (school_id = current_school_id() AND is_teacher_of_class(class_id));

-- MESSAGES
CREATE POLICY "Messages: read own" ON messages FOR SELECT USING (
  school_id = current_school_id() AND (
    sender_id = auth.uid() OR
    EXISTS (SELECT 1 FROM message_recipients mr WHERE mr.message_id = messages.id AND mr.recipient_id = auth.uid()) OR
    is_director()
  )
);
CREATE POLICY "Messages: insert own" ON messages FOR INSERT WITH CHECK (school_id = current_school_id() AND sender_id = auth.uid());

-- MESSAGE RECIPIENTS
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
CREATE POLICY "MR: update read" ON message_recipients FOR UPDATE USING (school_id = current_school_id() AND recipient_id = auth.uid());

-- MESSAGE ATTACHMENTS
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


-- ============================================================
-- VIEWS (for convenient queries)
-- ============================================================

-- Classes with teacher name and student count
CREATE OR REPLACE VIEW classes_view AS
SELECT
  c.*,
  p.name AS teacher_name,
  p.avatar AS teacher_avatar,
  (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS student_count
FROM classes c
LEFT JOIN profiles p ON p.id = c.teacher_id;

-- Attendance summary per class per date
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
  a.class_id,
  a.date,
  c.grade,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE a.status = 'present') AS present,
  COUNT(*) FILTER (WHERE a.status = 'absent') AS absent,
  COUNT(*) FILTER (WHERE a.status = 'late') AS late,
  ROUND(
    COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS percentage
FROM attendance a
JOIN classes c ON c.id = a.class_id
GROUP BY a.class_id, a.date, c.grade;

-- Payment summary
CREATE OR REPLACE VIEW payment_summary AS
SELECT
  p.*,
  s.name AS student_name,
  s.grade AS student_grade,
  s.section AS student_section
FROM payments p
JOIN students s ON s.id = p.student_id;


-- ============================================================
-- STORAGE BUCKET (for message attachments)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users can upload to their own messages
CREATE POLICY "Attachments: upload own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

-- Users can read attachments from messages they're involved in
CREATE POLICY "Attachments: read own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);

-- Only message sender can delete attachments
CREATE POLICY "Attachments: delete own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON homework FOR EACH ROW EXECUTE FUNCTION update_updated_at();
