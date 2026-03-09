-- Homework assignments
CREATE TABLE homework (
  id          SERIAL PRIMARY KEY,
  class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homework: director full" ON homework FOR ALL USING (is_director());
CREATE POLICY "Homework: profesor manages own" ON homework FOR ALL USING (
  is_teacher_of_class(class_id)
);

CREATE INDEX idx_homework_class ON homework(class_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON homework FOR EACH ROW EXECUTE FUNCTION update_updated_at();
