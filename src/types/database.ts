/** Auto-generated types matching supabase/schema.sql */

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      schools: {
        Row: School;
        Insert: Omit<School, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<School, "id">>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      academic_years: {
        Row: AcademicYear;
        Insert: Omit<AcademicYear, "id" | "school_id" | "created_at">;
        Update: Partial<Omit<AcademicYear, "id" | "school_id">>;
        Relationships: [];
      };
      students: {
        Row: Student;
        Insert: Omit<Student, "id" | "school_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Student, "id" | "school_id">>;
        Relationships: [];
      };
      classes: {
        Row: ClassRecord;
        Insert: Omit<ClassRecord, "id" | "school_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ClassRecord, "id" | "school_id">>;
        Relationships: [];
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, "id" | "school_id" | "created_at">;
        Update: Partial<Omit<Enrollment, "id" | "school_id">>;
        Relationships: [];
      };
      attendance: {
        Row: AttendanceRecord;
        Insert: Omit<AttendanceRecord, "id" | "school_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AttendanceRecord, "id" | "school_id">>;
        Relationships: [];
      };
      grades: {
        Row: GradeRecord;
        Insert: Omit<GradeRecord, "id" | "school_id" | "average" | "created_at" | "updated_at">;
        Update: Partial<Omit<GradeRecord, "id" | "school_id" | "average">>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRecord;
        Insert: Omit<PaymentRecord, "id" | "school_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PaymentRecord, "id" | "school_id">>;
        Relationships: [];
      };
      messages: {
        Row: MessageRecord;
        Insert: Omit<MessageRecord, "id" | "school_id" | "created_at">;
        Update: Partial<Omit<MessageRecord, "id" | "school_id">>;
        Relationships: [];
      };
      message_recipients: {
        Row: MessageRecipient;
        Insert: Omit<MessageRecipient, "id" | "school_id" | "created_at">;
        Update: Partial<Omit<MessageRecipient, "id" | "school_id">>;
        Relationships: [];
      };
      message_attachments: {
        Row: MessageAttachment;
        Insert: Omit<MessageAttachment, "id" | "school_id" | "created_at">;
        Update: Partial<Omit<MessageAttachment, "id" | "school_id">>;
        Relationships: [];
      };
      homework: {
        Row: HomeworkRecord;
        Insert: Omit<HomeworkRecord, "id" | "school_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<HomeworkRecord, "id" | "school_id">>;
        Relationships: [];
      };
    };
    Views: {
      classes_view: { Row: ClassView; Relationships: [] };
      attendance_summary: { Row: AttendanceSummary; Relationships: [] };
      payment_summary: { Row: PaymentSummaryView; Relationships: [] };
    };
    Functions: {};
  };
};

// ── Table row types ──────────────────────────────────────────

export type School = {
  id: string;
  name: string;
  tagline: string;
  logo_url: string;
  slug: string;
  status: "active" | "suspended" | "trial";
  plan: "basico" | "pro";
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  school_id: string;
  name: string;
  email: string | null;
  role: "director" | "profesor" | "padre";
  avatar: string | null;
  status: "active" | "inactive";
  phone: string | null;
  address: string | null;
  specializations: string | null;
  assigned_grades: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademicYear = {
  id: number;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type Student = {
  id: number;
  school_id: string;
  name: string;
  grade: string;
  section: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  address: string | null;
  status: "active" | "inactive" | "withdrawn";
  academic_year_id: number | null;
  created_at: string;
  updated_at: string;
};

export type GradeColumnConfig = { label: string; weight: number };

export type ClassRecord = {
  id: number;
  school_id: string;
  subject: string;
  grade: string;
  section: string;
  teacher_id: string | null;
  schedule: string | null;
  classroom: string | null;
  status: "active" | "inactive";
  academic_year_id: number | null;
  grade_config: GradeColumnConfig[] | null;
  created_at: string;
  updated_at: string;
};

export type Enrollment = {
  id: number;
  school_id: string;
  class_id: number;
  student_id: number;
  created_at: string;
};

export type AttendanceRecord = {
  id: number;
  school_id: string;
  class_id: number;
  student_id: number;
  date: string;
  status: "present" | "absent" | "late";
  created_at: string;
  updated_at: string;
};

export type GradeRecord = {
  id: number;
  school_id: string;
  class_id: number;
  student_id: number;
  period: string;
  exam1: number;
  exam2: number;
  homework: number;
  participation: number;
  average: number;
  grade_values: number[] | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRecord = {
  id: number;
  school_id: string;
  student_id: number;
  concept: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "paid" | "pending" | "overdue";
  payment_method: "manual" | "online" | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRecord = {
  id: number;
  school_id: string;
  sender_id: string;
  subject: string;
  content: string;
  category: string;
  created_at: string;
};

export type MessageRecipient = {
  id: number;
  school_id: string;
  message_id: number;
  recipient_type: "user" | "group" | "grade";
  recipient_id: string | null;
  recipient_label: string;
  is_read: boolean;
  created_at: string;
};

export type MessageAttachment = {
  id: number;
  school_id: string;
  message_id: number;
  file_name: string;
  file_path: string;
  file_size: string | null;
  file_type: string | null;
  created_at: string;
};

export type HomeworkRecord = {
  id: number;
  school_id: string;
  class_id: number;
  title: string;
  description: string | null;
  due_date: string;
  created_at: string;
  updated_at: string;
};

// ── View types ───────────────────────────────────────────────

export type ClassView = ClassRecord & {
  teacher_name: string | null;
  teacher_avatar: string | null;
  student_count: number;
};

export type AttendanceSummary = {
  class_id: number;
  date: string;
  grade: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

export type PaymentSummaryView = PaymentRecord & {
  student_name: string;
  student_grade: string;
  student_section: string;
};
