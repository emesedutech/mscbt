-- =================================================================
-- SEKSI 0: PEMBERSIHAN TOTAL SKEMA DATABASE (DANGER ZONE)
-- Menghapus semua tabel dan fungsi yang ada untuk memastikan clean slate.
-- =================================================================
-- Aktifkan ekstensi pgcrypto untuk hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop semua tabel yang ada dengan CASCADE untuk mengatasi dependensi
DROP TABLE IF EXISTS public.reseller_commissions CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.exam_results CASCADE;
DROP TABLE IF EXISTS public.exam_sessions CASCADE;
DROP TABLE IF EXISTS public.exam_schedules CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.question_banks CASCADE;
DROP TABLE IF EXISTS public.master_ruang CASCADE;
DROP TABLE IF EXISTS public.master_rombel CASCADE;
DROP TABLE IF EXISTS public.master_kelas CASCADE;
DROP TABLE IF EXISTS public.master_mapel CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.school_profiles CASCADE;
DROP TABLE IF EXISTS public.global_questions CASCADE;
DROP TABLE IF EXISTS public.global_question_banks CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;
DROP TABLE IF EXISTS public.resellers CASCADE;
DROP TABLE IF EXISTS public.super_admins CASCADE;

-- Drop tabel sisa dari template Supabase yang menyebabkan konflik
DROP TABLE IF EXISTS public.sa_users CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Drop fungsi helper & RPC
DROP FUNCTION IF EXISTS public.get_current_school_id();
DROP FUNCTION IF EXISTS public.login_cbt_user(text, text, text);
DROP FUNCTION IF EXISTS public.login_global_user(text, text);
DROP FUNCTION IF EXISTS public.hash_password();


-- =================================================================
-- SEKSI 1: PEMBUATAN ULANG SKEMA DATABASE
-- =================================================================

-- Tabel untuk Super Admin
CREATE TABLE IF NOT EXISTS public.super_admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE NOT NULL,
    password text NOT NULL, -- Akan di-hash
    created_at timestamptz DEFAULT now()
);

-- Tabel untuk Reseller/Mitra
CREATE TABLE IF NOT EXISTS public.resellers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama text NOT NULL,
    email text UNIQUE NOT NULL,
    telepon text,
    alamat text,
    kota text,
    is_active boolean DEFAULT true,
    username text UNIQUE NOT NULL,
    password text, -- Akan di-hash
    created_at timestamptz DEFAULT now()
);

-- Tabel untuk tenant/sekolah
CREATE TABLE IF NOT EXISTS public.schools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama text NOT NULL,
    npsn text UNIQUE NOT NULL,
    subdomain text UNIQUE,
    status text DEFAULT 'PENDING',
    kota text,
    jenjang text,
    subscription_plan text DEFAULT 'BASIC',
    quota_limit integer DEFAULT 100,
    referral_id text,
    created_at timestamptz DEFAULT now()
);

-- Tabel untuk Bank Soal Global
CREATE TABLE IF NOT EXISTS public.global_question_banks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subject text,
    level text,
    description text,
    question_count integer DEFAULT 0,
    author text,
    created_at timestamptz DEFAULT now()
);

-- Tabel untuk Butir Soal Global
CREATE TABLE IF NOT EXISTS public.global_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    global_bank_id uuid REFERENCES public.global_question_banks(id) ON DELETE CASCADE,
    type text NOT NULL,
    subject text,
    levels text[],
    category text,
    difficulty text,
    question_text text NOT NULL,
    options jsonb,
    statements jsonb,
    matching_pairs jsonb,
    weight numeric DEFAULT 1,
    discussion text,
    updated_at timestamptz DEFAULT now()
);

-- =================================================================
-- 2. TABEL TENANT (TERISOLASI PER SEKOLAH)
-- =================================================================

CREATE TABLE IF NOT EXISTS public.school_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    npsn text,
    nama_sekolah text,
    jenjang text,
    status text,
    alamat text,
    kota_kabupaten text,
    provinsi text,
    kode_pos text,
    telepon text,
    email text,
    website text,
    kop_surat text,
    kepala_sekolah text,
    nip_kepala_sekolah text
);

CREATE TABLE IF NOT EXISTS public.teachers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    nip text NOT NULL,
    nama text NOT NULL,
    gelar_depan text,
    gelar_belakang text,
    jenis_kelamin text,
    mata_pelajaran text[],
    status text,
    jabatan text,
    email text,
    no_hp text,
    username text,
    password text, -- Akan di-hash
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(school_id, nip),
    UNIQUE(school_id, username)
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    nis text NOT NULL,
    nama text NOT NULL,
    jenis_kelamin text,
    kelas text,
    rombel text,
    status text DEFAULT 'Aktif',
    username text,
    password text, -- Akan di-hash
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(school_id, nis),
    UNIQUE(school_id, username)
);

CREATE TABLE IF NOT EXISTS public.master_mapel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    kode text,
    nama text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.master_kelas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    nama text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.master_rombel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    kelas_id uuid NOT NULL REFERENCES public.master_kelas(id) ON DELETE CASCADE,
    nama text NOT NULL,
    UNIQUE(school_id, kelas_id, nama)
);

CREATE TABLE IF NOT EXISTS public.master_ruang (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    kode text,
    nama text NOT NULL,
    kapasitas integer,
    lokasi text
);

CREATE TABLE IF NOT EXISTS public.question_banks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    subject text,
    level text,
    is_active boolean DEFAULT true,
    description text
);

CREATE TABLE IF NOT EXISTS public.questions (
    id text PRIMARY KEY DEFAULT 'soal_' || gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    bank_id uuid REFERENCES public.question_banks(id) ON DELETE CASCADE,
    type text,
    subject text,
    levels text[],
    category text,
    difficulty text,
    question_text text,
    options jsonb,
    statements jsonb,
    matching_pairs jsonb,
    correct_answers text[],
    weight numeric,
    discussion text,
    updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.exam_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name text,
    code text,
    bank_id uuid REFERENCES public.question_banks(id) ON DELETE SET NULL,
    subject text,
    level text,
    question_count integer,
    duration integer,
    total_weight numeric,
    randomize_questions boolean,
    randomize_options boolean,
    scoring_mode text,
    passing_grade numeric,
    status text
);

CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name text,
    schedule_id uuid REFERENCES public.exam_schedules(id) ON DELETE SET NULL,
    date date,
    start_time time,
    end_time time,
    rooms jsonb,
    proctor_instructions text,
    student_instructions text,
    status text,
    announcement text
);

CREATE TABLE IF NOT EXISTS public.exam_results (
    id text PRIMARY KEY DEFAULT 'res_' || gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    schedule_id uuid REFERENCES public.exam_schedules(id) ON DELETE SET NULL,
    session_name text,
    student_id text,
    student_name text,
    nis text,
    start_time timestamptz,
    end_time timestamptz,
    total_questions integer,
    answered integer,
    correct integer,
    incorrect integer,
    score numeric,
    max_score numeric,
    final_grade numeric,
    is_passed boolean,
    answers jsonb,
    status text,
    violations_count integer,
    extra_time integer,
    activity_logs text[]
);

-- =================================================================
-- 3. TABEL RELASIONAL (BILLING, DLL)
-- =================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
    invoice_id_str text,
    status text DEFAULT 'pending',
    amount numeric,
    period_start date,
    period_end date,
    due_date date,
    created_at timestamptz DEFAULT now(),
    payment_date timestamptz,
    item_description text,
    recipient_id uuid,
    recipient_type text, -- 'school' or 'reseller'
    recipient_name text,
    recipient_details text
);

CREATE TABLE IF NOT EXISTS public.reseller_commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id uuid NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    commission_amount numeric,
    status text DEFAULT 'unpaid', -- 'unpaid' or 'paid'
    created_at timestamptz DEFAULT now(),
    paid_at timestamptz,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL
);

-- =================================================================
-- 4. FUNGSI HELPER & KEBIJAKAN RLS (ROW LEVEL SECURITY)
-- =================================================================

-- Fungsi untuk hashing password otomatis sebelum insert/update
CREATE OR REPLACE FUNCTION public.hash_password()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.password IS DISTINCT FROM OLD.password THEN
    IF NEW.password IS NOT NULL AND NEW.password != '' THEN
      NEW.password = crypt(NEW.password, gen_salt('bf'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Terapkan trigger ke tabel-tabel yang memiliki password
CREATE TRIGGER hash_teacher_password BEFORE INSERT OR UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.hash_password();
CREATE TRIGGER hash_student_password BEFORE INSERT OR UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.hash_password();
CREATE TRIGGER hash_reseller_password BEFORE INSERT OR UPDATE ON public.resellers FOR EACH ROW EXECUTE FUNCTION public.hash_password();
CREATE TRIGGER hash_super_admin_password BEFORE INSERT OR UPDATE ON public.super_admins FOR EACH ROW EXECUTE FUNCTION public.hash_password();

-- Helper function
CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'school_id', '')::uuid;
$$;

-- Mengaktifkan RLS untuk semua tabel
ALTER TABLE public.school_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_rombel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_ruang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- KEBIJAKAN RLS (PERBAIKAN LOGIKA & KEAMANAN)
-- =================================================================

-- 1. PEMBERSIHAN TOTAL SEMUA KEBIJAKAN LAMA UNTUK MENGHINDARI KONFLIK
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename) || ';';
    END LOOP;
END $$;


-- 2. KEBIJAKAN ISOLASI TENANT (UNTUK PENGGUNA TEROTENTIKASI)
DO $$
DECLARE
    t text;
    tables_to_protect text[] := ARRAY[
        'school_profiles', 'teachers', 'students', 'master_mapel', 
        'master_kelas', 'master_rombel', 'master_ruang', 'question_banks', 
        'questions', 'exam_schedules', 'exam_sessions', 'exam_results'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_protect
    LOOP
        EXECUTE format('
            CREATE POLICY "Tenant isolation for authenticated users" 
            ON public.%I
            FOR ALL
            TO authenticated
            USING (school_id = public.get_current_school_id())
            WITH CHECK (school_id = public.get_current_school_id());
        ', t);
    END LOOP;
END $$;


-- =================================================================
-- SEKSI 5: FUNGSI RPC UNTUK LOGIN AMAN
-- =================================================================

-- Fungsi untuk login Super Admin dan Reseller (dengan perbandingan hash)
CREATE OR REPLACE FUNCTION public.login_global_user(username_param text, password_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  result json;
BEGIN
  -- Cek super_admins dengan perbandingan hash
  SELECT * INTO user_record FROM public.super_admins WHERE username = username_param AND password = crypt(password_param, password);
  IF FOUND THEN
    SELECT json_build_object('user', user_record, 'role', 'super_admin') INTO result;
    RETURN result;
  END IF;

  -- Cek resellers dengan perbandingan hash
  SELECT * INTO user_record FROM public.resellers WHERE username = username_param AND password = crypt(password_param, password);
  IF FOUND THEN
    IF user_record.is_active = false THEN
      RETURN null; -- Akun tidak aktif
    END IF;
    SELECT json_build_object('user', user_record, 'role', 'reseller') INTO result;
    RETURN result;
  END IF;

  RETURN null;
END;
$$;


-- Fungsi untuk login Admin Sekolah, Guru, dan Siswa (dengan perbandingan hash)
CREATE OR REPLACE FUNCTION public.login_cbt_user(npsn_param text, username_param text, password_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  school_record RECORD;
  user_record RECORD;
  result json;
BEGIN
  -- Cari sekolah berdasarkan NPSN
  SELECT id INTO school_record FROM public.schools WHERE npsn = npsn_param;
  IF NOT FOUND THEN
    RETURN null; -- Sekolah tidak ditemukan
  END IF;

  -- Cek teachers dengan perbandingan hash
  SELECT id, school_id, nip, nama, jabatan, username INTO user_record 
  FROM public.teachers 
  WHERE school_id = school_record.id 
  AND (username = username_param OR nip = username_param)
  AND password = crypt(password_param, password);
  IF FOUND THEN
    SELECT json_build_object('user', user_record, 'role', 
      CASE user_record.jabatan
        WHEN 'Admin Sistem' THEN 'admin'
        WHEN 'Kepala Sekolah' THEN 'admin'
        WHEN 'Wakil Kepala Sekolah' THEN 'admin'
        WHEN 'Proktor Sesi' THEN 'proktor'
        WHEN 'Pengawas Ruang' THEN 'pengawas'
        ELSE 'guru'
      END
    ) INTO result;
    RETURN result;
  END IF;

  -- Cek students dengan perbandingan hash
  SELECT id, school_id, nis, nama, kelas, rombel, username, status INTO user_record 
  FROM public.students
  WHERE school_id = school_record.id
  AND (username = username_param OR nis = username_param)
  AND password = crypt(password_param, password);
  IF FOUND THEN
    IF user_record.status <> 'Aktif' THEN
        RETURN null; -- Siswa tidak aktif
    END IF;
    SELECT json_build_object('user', user_record, 'role', 'siswa') INTO result;
    RETURN result;
  END IF;

  RETURN null;
END;
$$;

-- Berikan hak eksekusi ke peran anon (publik).
GRANT EXECUTE ON FUNCTION public.login_global_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.login_cbt_user(text, text, text) TO anon;

-- =================================================================
-- SEKSI 6: SEEDING DATA AWAL (DIAMANKAN)
-- =================================================================
-- Password superadmin tidak lagi di-hardcode.
-- Gunakan SQL Editor di Supabase untuk membuat/mengupdate superadmin:
-- INSERT INTO public.super_admins (username, password) VALUES ('superadmin', 'your_secure_password');
-- atau untuk update:
-- UPDATE public.super_admins SET password = 'new_secure_password' WHERE username = 'superadmin';
-- Trigger akan otomatis melakukan hashing.
