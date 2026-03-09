-- ============================================================
-- Tu Escuela — Seed Data
-- Run AFTER schema.sql to populate with sample data
-- NOTE: Users must be created via Supabase Auth first.
--       This script assumes profiles already exist.
-- ============================================================

-- 1. Academic Year
-- ============================================================
INSERT INTO academic_years (name, start_date, end_date, is_active) VALUES
  ('2026', '2026-03-02', '2026-12-18', true);


-- 2. Students (academic_year_id = 1)
-- ============================================================
INSERT INTO students (name, grade, section, parent_name, parent_phone, parent_email, address, academic_year_id) VALUES
  ('María González Pérez',     '5° Primaria',   'A', 'Carlos González',   '+51 987 654 321', 'carlos.gonzalez@email.com',   'Av. Los Olivos 234, San Isidro',       1),
  ('Juan Pérez Rodríguez',     '4° Primaria',   'B', 'Ana Rodríguez',     '+51 976 543 210', 'ana.rodriguez@email.com',     'Jr. Las Flores 567, Miraflores',       1),
  ('Sofía Martínez López',     '3° Secundaria', 'A', 'Roberto Martínez',  '+51 965 432 109', 'roberto.martinez@email.com',  'Calle Los Pinos 890, Surco',           1),
  ('Diego Ramírez Silva',      '2° Secundaria', 'B', 'Patricia Silva',    '+51 954 321 098', 'patricia.silva@email.com',    'Av. Primavera 123, San Borja',         1),
  ('Valentina Torres Castro',  '4 años',        'A', 'Luis Torres',       '+51 943 210 987', 'luis.torres@email.com',       'Jr. Los Cedros 456, La Molina',        1),
  ('Mateo Flores Ruiz',        '1° Secundaria', 'A', 'Carmen Flores',     '+51 932 109 876', 'carmen.flores@email.com',     'Av. Javier Prado 789, Magdalena',      1),
  ('Isabella Vargas Díaz',     '5 años',        'B', 'Fernando Vargas',   '+51 921 098 765', 'fernando.vargas@email.com',   'Calle Las Palmeras 321, Jesús María',  1),
  ('Santiago Morales Cruz',    '3° Primaria',   'A', 'Elena Morales',     '+51 910 987 654', 'elena.morales@email.com',     'Av. Brasil 654, Pueblo Libre',         1),
  ('Camila Herrera Ortiz',     '6° Primaria',   'B', 'Miguel Herrera',    '+51 909 876 543', 'miguel.herrera@email.com',    'Jr. Cusco 234, Lince',                 1),
  ('Alejandro Soto Méndez',   '2° Primaria',   'B', 'Laura Soto',        '+51 898 765 432', 'laura.soto@email.com',        'Av. Arequipa 567, San Isidro',         1),
  ('Luciana Castro Paredes',   '5° Primaria',   'A', 'Jorge Castro',      '+51 887 654 321', 'jorge.castro@email.com',      'Calle Lima 890, Barranco',             1),
  ('Emilio Guzmán Vega',       '3° Primaria',   'A', 'Rosa Guzmán',       '+51 876 543 210', 'rosa.guzman@email.com',       'Jr. Tacna 123, Breña',                 1),
  ('Renata Delgado Cruz',      '4° Primaria',   'A', 'Pedro Delgado',     '+51 865 432 109', 'pedro.delgado@email.com',     'Av. Colonial 456, Callao',             1),
  ('Nicolás Peña Romero',      '4° Secundaria', 'A', 'María Peña',        '+51 854 321 098', 'maria.pena@email.com',        'Calle Grau 789, Chorrillos',           1),
  ('Antonella Ríos Luna',      '3 años',        'B', 'Carlos Ríos',       '+51 843 210 987', 'carlos.rios@email.com',       'Jr. Huancayo 321, San Miguel',         1),
  ('Gabriel Navarro Campos',   '2° Primaria',   'A', 'Ana Navarro',       '+51 832 109 876', 'ana.navarro@email.com',       'Av. Venezuela 654, Lima',              1),
  ('Mariana León Salazar',     '5° Secundaria', 'B', 'Roberto León',      '+51 821 098 765', 'roberto.leon@email.com',      'Calle Junín 987, Rímac',               1),
  ('Daniel Aguilar Ponce',     '4° Primaria',   'B', 'Carmen Aguilar',    '+51 810 987 654', 'carmen.aguilar@email.com',    'Jr. Piura 210, Comas',                 1),
  ('Victoria Medina Torres',   '3° Secundaria', 'B', 'Fernando Medina',   '+51 809 876 543', 'fernando.medina@email.com',   'Av. Universitaria 543, SMP',           1),
  ('Tomás Reyes Figueroa',     '6° Primaria',   'A', 'Silvia Reyes',      '+51 798 765 432', 'silvia.reyes@email.com',      'Calle Ica 876, Surquillo',             1),
  ('Paula Jiménez Bravo',      '1° Primaria',   'A', 'Diego Jiménez',     '+51 787 654 321', 'diego.jimenez@email.com',     'Jr. Loreto 109, Magdalena',            1);


-- 3. Classes (teacher_id will be set after creating auth users)
-- These use NULL teacher_id; update them after creating professor accounts
-- ============================================================
INSERT INTO classes (subject, grade, section, schedule, classroom, status, academic_year_id) VALUES
  ('Matemática',        '3° Primaria',   'A', 'Lun-Mie-Vie 8:00-9:30',  'Aula 101', 'active',   1),
  ('Comunicación',      '4° Primaria',   'B', 'Mar-Jue 10:00-11:30',    'Aula 102', 'active',   1),
  ('Ciencias',          '2° Secundaria', 'A', 'Lun-Mie 14:00-15:30',    'Lab 201',  'active',   1),
  ('Historia',          '3° Secundaria', 'B', 'Mar-Jue-Vie 8:00-9:30',  'Aula 301', 'active',   1),
  ('Inglés',            '5 años',        'A', 'Lun-Mie-Vie 10:00-11:30','Aula 001', 'active',   1),
  ('Educación Física',  '2° Primaria',   'A', 'Mar-Jue 14:00-15:30',    'Patio',    'active',   1),
  ('Arte y Cultura',    '4 años',        'B', 'Lun-Vie 8:00-9:30',      'Taller',   'inactive', 1),
  ('Matemática',        '1° Secundaria', 'B', 'Mar-Jue 8:00-9:30',      'Aula 202', 'active',   1);


-- 4. Enrollments (sample: assign students to classes)
-- ============================================================
-- Class 1: Matemática 3° Primaria A → students in 3° Primaria A
INSERT INTO enrollments (class_id, student_id) VALUES
  (1, 8),   -- Santiago Morales
  (1, 12);  -- Emilio Guzmán

-- Class 2: Comunicación 4° Primaria B → students in 4° Primaria B
INSERT INTO enrollments (class_id, student_id) VALUES
  (2, 2),   -- Juan Pérez
  (2, 18);  -- Daniel Aguilar

-- Class 3: Ciencias 2° Secundaria A → students in 2° Secundaria
INSERT INTO enrollments (class_id, student_id) VALUES
  (3, 4);   -- Diego Ramírez

-- Class 4: Historia 3° Secundaria B → students in 3° Secundaria
INSERT INTO enrollments (class_id, student_id) VALUES
  (4, 3),   -- Sofía Martínez
  (4, 19);  -- Victoria Medina

-- Class 5: Inglés 5 años A → students in 5 años/4 años
INSERT INTO enrollments (class_id, student_id) VALUES
  (5, 5);   -- Valentina Torres

-- Class 6: Ed. Física 2° Primaria A
INSERT INTO enrollments (class_id, student_id) VALUES
  (6, 10),  -- Alejandro Soto
  (6, 16);  -- Gabriel Navarro

-- Class 8: Matemática 1° Secundaria B
INSERT INTO enrollments (class_id, student_id) VALUES
  (8, 6);   -- Mateo Flores


-- 5. Payments (March 2026)
-- ============================================================
INSERT INTO payments (student_id, concept, amount, due_date, paid_date, status) VALUES
  (1,  'Pensión Escolar', 450, '2026-03-01', '2026-02-28', 'paid'),
  (2,  'Pensión Escolar', 450, '2026-03-01', '2026-03-01', 'paid'),
  (3,  'Pensión Escolar', 450, '2026-03-01', NULL,          'pending'),
  (4,  'Pensión Escolar', 450, '2026-02-01', NULL,          'overdue'),
  (5,  'Pensión Escolar', 350, '2026-03-01', '2026-03-05', 'paid'),
  (6,  'Pensión Escolar', 450, '2026-03-01', '2026-03-02', 'paid'),
  (7,  'Pensión Escolar', 350, '2026-03-01', NULL,          'pending'),
  (8,  'Pensión Escolar', 450, '2026-03-01', '2026-03-03', 'paid'),
  (9,  'Pensión Escolar', 450, '2026-03-01', NULL,          'pending'),
  (10, 'Pensión Escolar', 450, '2026-02-01', NULL,          'overdue'),
  (11, 'Pensión Escolar', 450, '2026-03-01', '2026-03-01', 'paid'),
  (12, 'Pensión Escolar', 450, '2026-03-01', NULL,          'pending'),
  (13, 'Pensión Escolar', 450, '2026-03-01', '2026-03-04', 'paid'),
  (14, 'Pensión Escolar', 450, '2026-02-01', NULL,          'overdue'),
  (15, 'Pensión Escolar', 350, '2026-03-01', '2026-03-02', 'paid'),
  (16, 'Pensión Escolar', 450, '2026-03-01', NULL,          'pending'),
  (17, 'Pensión Escolar', 450, '2026-03-01', '2026-03-06', 'paid'),
  (18, 'Pensión Escolar', 450, '2026-03-01', NULL,          'pending'),
  (19, 'Pensión Escolar', 450, '2026-02-01', NULL,          'overdue'),
  (20, 'Pensión Escolar', 450, '2026-03-01', '2026-03-01', 'paid'),
  (21, 'Pensión Escolar', 450, '2026-03-01', NULL,          'pending');


-- 6. Sample Grades (Bimestre 1, Class 1: Matemática 3° Primaria A)
-- ============================================================
INSERT INTO grades (class_id, student_id, period, exam1, exam2, homework, participation) VALUES
  (1, 8,  'bimestre_1', 16, 17, 15, 16),
  (1, 12, 'bimestre_1', 18, 17, 19, 18);


-- 7. Sample Attendance (March 8, 2026)
-- ============================================================
INSERT INTO attendance (class_id, student_id, date, status) VALUES
  (1, 8,  '2026-03-08', 'present'),
  (1, 12, '2026-03-08', 'present'),
  (2, 2,  '2026-03-08', 'present'),
  (2, 18, '2026-03-08', 'late'),
  (3, 4,  '2026-03-08', 'absent'),
  (4, 3,  '2026-03-08', 'present'),
  (4, 19, '2026-03-08', 'present'),
  (5, 5,  '2026-03-08', 'present'),
  (6, 10, '2026-03-08', 'present'),
  (6, 16, '2026-03-08', 'present'),
  (8, 6,  '2026-03-08', 'present');
