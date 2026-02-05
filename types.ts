import React from 'react';

// Common types
export type UserRole = 'super_admin' | 'admin' | 'guru' | 'proktor' | 'pengawas' | 'siswa' | 'reseller';
export type PackageStatus = 'Draft' | 'Review' | 'Siap' | 'Arsip';
export type SubscriptionPlan = 'BASIC' | 'PRO';
export type SchoolStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

// UI Types
export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

export interface BreadcrumbItem {
  label: string;
}

// Data Models
export interface School {
  id: string;
  nama: string;
  npsn: string;
  subdomain?: string;
  status: SchoolStatus;
  kota: string;
  jenjang: string;
  subscription_plan: SubscriptionPlan;
  quota_limit: number;
  referral_id: string;
  students?: { count: number }[];
  exam_sessions?: { count: number }[];
}

export interface Reseller {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  alamat: string;
  kota: string;
  is_active: boolean;
  username: string;
  password?: string;
}

export interface ResellerCommission {
  id: string;
  reseller_id: string;
  school_id: string;
  commission_amount: number;
  status: 'unpaid' | 'paid';
  created_at: string;
  paid_at?: string;
  invoice_id?: string;
  schools?: { nama: string };
}

export interface Invoice {
  id: string;
  school_id: string;
  invoice_id_str: string;
  status: 'pending' | 'paid';
  amount: number;
  period_start: string;
  period_end: string;
  due_date: string;
  created_at: string;
  payment_date?: string;
  item_description: string;
  recipient_id: string;
  recipient_type: 'school' | 'reseller';
  recipient_name: string;
  recipient_details: string;
}

export interface SchoolProfile {
  id?: string;
  school_id: string;
  npsn: string;
  nama_sekolah: string;
  jenjang: string;
  status: string;
  alamat: string;
  kota_kabupaten: string;
  provinsi: string;
  kode_pos: string;
  telepon: string;
  email: string;
  website: string;
  kop_surat: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
}

export interface SubjectMaster {
  id: string;
  school_id: string;
  kode: string;
  nama: string;
}

export interface GradeLevel {
  id: string;
  school_id: string;
  nama: string;
}

export interface RombelMaster {
  id: string;
  school_id: string;
  kelas_id: string;
  nama: string;
}

export interface ExamRoom {
  id: string;
  school_id: string;
  nama: string;
  kode: string;
  kapasitas: number;
  lokasi: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  nip: string;
  nama: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  mata_pelajaran: string[];
  status: 'PNS' | 'PPPK' | 'GTT' | 'GTY';
  jabatan: 'Guru Mapel' | 'Wali Kelas' | 'Kepala Sekolah' | 'Wakil Kepala Sekolah' | 'Admin Sistem' | 'Proktor Sesi' | 'Pengawas Ruang';
  email?: string;
  no_hp?: string;
  username?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  nis: string;
  nama: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  kelas: string;
  rombel: string;
  status: 'Aktif' | 'Tidak Aktif' | 'Pindah' | 'Lulus';
  username: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

// Strictly Objective Question Types (No Essay/Short Answer)
export type QuestionType = 'pilihan_ganda' | 'pilihan_ganda_kompleks' | 'benar_salah' | 'menjodohkan';

export interface QuestionOption {
  label: string;
  text: string;
  is_correct: boolean;
}

export interface TrueFalseStatement {
  id: string;
  text: string;
  is_true: boolean;
}

export interface MatchPair {
  id: string;
  left_text: string;
  right_text: string;
}

export interface Question {
  id: string;
  school_id: string;
  bank_id: string;
  type: QuestionType;
  subject: string;
  levels: string[];
  category: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
  question_text: string;
  options?: QuestionOption[];
  statements?: TrueFalseStatement[];
  matching_pairs?: MatchPair[];
  correct_answers?: string[];
  weight: number;
  discussion?: string;
  updated_at?: string;
}

export interface QuestionBank {
  id: string;
  school_id: string;
  subject: string;
  level: string;
  question_count: number;
  is_active: boolean;
}

// Global Questions (Shared across tenants)
export interface GlobalQuestionBank {
  id: string;
  name: string;
  subject: string;
  level: string;
  description: string;
  question_count: number;
  author: string;
  created_at: string;
}

export interface GlobalQuestion extends Omit<Question, 'school_id' | 'bank_id'> {
  global_bank_id: string;
}

export interface ExamSchedule {
  id: string;
  school_id: string;
  name: string;
  code: string;
  bank_id: string;
  subject: string;
  level: string;
  question_count: number;
  duration: number;
  total_weight: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  scoring_mode: 'Standar' | 'Minus';
  passing_grade: number;
  status: string;
  // FIX: Added 'question_ids' to ExamSchedule type to resolve TS error. This property is essential for managing package content.
  question_ids?: string[];
}

export interface SessionRoom {
  id: string;
  nama: string;
  kapasitas: number;
  lokasi: string;
  supervisor_ids: string[];
  proctor_id: string;
  student_ids: string[];
  token: string;
}

export interface ExamSession {
  id: string;
  school_id: string;
  name: string;
  schedule_id: string;
  date: string;
  start_time: string;
  end_time: string;
  rooms: SessionRoom[];
  proctor_instructions?: string;
  student_instructions?: string;
  status: 'Disiapkan' | 'Berlangsung' | 'Selesai';
  announcement?: string; // Pesan dari proktor
}

export interface StudentAnswer {
  question_id: string;
  answer: any;
  is_doubtful: boolean;
  updated_at: string;
}

export interface ExamResult {
  id: string;
  school_id: string;
  session_id: string;
  schedule_id: string;
  session_name: string;
  student_id: string;
  student_name: string;
  nis: string;
  start_time: string;
  end_time: string;
  total_questions: number;
  answered: number;
  correct: number;
  incorrect: number;
  score: number;
  max_score: number;
  final_grade: number;
  is_passed: boolean;
  answers: StudentAnswer[];
  status: 'Selesai' | 'Auto-Submit' | 'Sedang Ujian' | 'Diblokir';
  violations_count: number;
  extra_time: number; // Tambahan waktu per individu
  activity_logs?: string[]; // Log aktivitas teknis
  synced?: boolean;
}

export interface StudentExamSession {
  student_id: string;
  student_name: string;
  nis: string;
  session_id: string;
  session_name: string;
  schedule_id: string;
  room_id: string;
  login_time: string;
  duration_minutes: number;
  expiry_time: string;
  passing_grade: number;
}

export interface StudentMonitoringState {
  student_id: string;
  nis: string;
  nama: string;
  kelas: string;
  status: 'Belum Login' | 'Sedang Ujian' | 'Sudah Dikirim' | 'Diblokir';
  progress: number;
  total_soal: number;
  login_time?: string;
  submit_time?: string;
  extra_time: number;
  is_blocked: boolean;
  result_id?: string;
  last_sync?: string;
  violations_count: number;
}

export interface Proctor {
  id: string;
  nama: string;
  nip?: string;
  username: string;
}

export interface Supervisor {
  id: string;
  nama: string;
  nip?: string;
  username: string;
}

export interface ExamAssignment {
  id: string;
  supervisor_id: string;
  nama_ujian: string;
  tanggal: string;
  ruang: string;
}

// FIX: Updated ItemAnalysisResult to use string for question_id and align property names with generation logic.
export interface ItemAnalysisResult {
  question_id: string;
  key: string;
  correct: number;
  incorrect: number;
  difficulty: number;
  percentage: number;
  classification: 'Mudah' | 'Sedang' | 'Sukar';
  recommendation: string;
}