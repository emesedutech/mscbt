
import React from 'react';
import { 
  School, 
  Users, 
  FileText, 
  Calendar, 
  PlayCircle, 
  ClipboardCheck, 
  BarChart3, 
  Settings,
  LayoutDashboard,
  Layers,
  User,
  History,
  Building2,
  GraduationCap,
  BookOpen,
  MapPin,
  UserCheck,
  SlidersHorizontal,
  ShieldCheck,
  Handshake,
  Database,
  CreditCard,
  DollarSign,
  Globe,
  Library,
  Sparkles
} from 'lucide-react';
import { MenuItem } from './types.ts';

export const SUPERADMIN_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'tenant-management', label: 'Manajemen Tenant', icon: <ShieldCheck size={20} />, path: '/manajemen-tenant' },
  { id: 'reseller-management', label: 'Manajemen Reseller', icon: <Handshake size={20} />, path: '/manajemen-reseller' },
  { id: 'global-bank', label: 'Library Soal Pusat', icon: <Globe size={20} />, path: '/bank-soal-global' },
  { id: 'billing', label: 'Billing & Faktur', icon: <CreditCard size={20} />, path: '/billing' },
  { id: 'resource-monitoring', label: 'Monitoring Sumber Daya', icon: <Database size={20} />, path: '/monitoring-sumberdaya' },
];

export const RESELLER_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'schools', label: 'Sekolah Mitra', icon: <Building2 size={20} />, path: '/sekolah' },
  { id: 'commissions', label: 'Riwayat Komisi', icon: <DollarSign size={20} />, path: '/komisi' },
];

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { 
    id: 'school-profile', 
    label: 'Konfigurasi Awal', 
    icon: <SlidersHorizontal size={20} />, 
    path: '/profil-sekolah',
    children: [
      { id: 'profile-identity', label: 'Profil Sekolah', icon: <School size={16} />, path: '/profil-sekolah' },
      { id: 'profile-master', label: 'Master Data', icon: <Database size={16} />, path: '/profil-sekolah/master-data' },
    ]
  },
  { 
    id: 'data-users', 
    label: 'Data Pengguna', 
    icon: <Users size={20} />, 
    path: '/data-pengguna',
    children: [
      { id: 'users-pengelola', label: 'Pengelola', icon: <UserCheck size={16} />, path: '/data-pengguna' },
      { id: 'users-peserta', label: 'Peserta Didik', icon: <User size={16} />, path: '/data-pengguna/peserta' },
      { id: 'users-akses', label: 'Proktor & Pengawas', icon: <ShieldCheck size={16} />, path: '/data-pengguna/akses' },
    ]
  },
  { 
    id: 'question-source', 
    label: 'Sumber Soal', 
    icon: <Library size={20} />, 
    path: '/bank-soal',
    children: [
      { id: 'question-bank', label: 'Bank Soal Lokal', icon: <FileText size={16} />, path: '/bank-soal' },
      { id: 'global-discovery', label: 'Bank Soal Pusat', icon: <Globe size={16} />, path: '/bank-soal-pusat' },
    ]
  },
  { id: 'exam-packages', label: 'Paket Ujian', icon: <Layers size={20} />, path: '/paket-ujian' },
  { id: 'exam-execution-pkgs', label: 'Jadwal Ujian', icon: <Calendar size={20} />, path: '/jadwal-ujian' },
  { id: 'exam-execution', label: 'Pelaksanaan', icon: <PlayCircle size={20} />, path: '/pelaksanaan' },
  { id: 'reports', label: 'Laporan', icon: <BarChart3 size={20} />, path: '/laporan' },
  { id: 'settings', label: 'Pengaturan', icon: <Settings size={20} />, path: '/pengaturan' },
];

export const STUDENT_MENU_ITEMS: MenuItem[] = [
  { id: 'student-dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'student-exams', label: 'Jadwal Ujian', icon: <Calendar size={20} />, path: '/jadwal-ujian-siswa' },
  { id: 'student-results', label: 'Riwayat Hasil', icon: <History size={20} />, path: '/riwayat-hasil' },
  { id: 'student-profile', label: 'Profil Saya', icon: <User size={20} />, path: '/profil-user' },
];

// RBAC: Menu Permission Mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['dashboard', 'tenant-management', 'reseller-management', 'global-bank', 'billing', 'resource-monitoring'],
  admin: ['dashboard', 'school-profile', 'data-users', 'question-source', 'exam-packages', 'exam-execution-pkgs', 'exam-execution', 'reports', 'settings', 'profil-user', 'pengaturan'],
  guru: ['question-source', 'exam-packages', 'reports', 'profil-user'],
  proktor: ['exam-execution-pkgs', 'exam-execution', 'profil-user'],
  pengawas: ['exam-execution', 'profil-user'],
};

export const SCHOOL_NAME = "Emes CBT";
export const LOGO_URL = "/logo.png";

export const PKT_STATUS_DRAFT = 'Draft';
export const PKT_STATUS_READY = 'Siap Digunakan';

export const SUBJECTS_LIST = [
  'Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 
  'PAI', 'PKn', 'PJOK', 'Seni Budaya', 'Prakarya', 'Informatika'
];

export const EMPLOYMENT_STATUSES = ['PNS', 'PPPK', 'GTT', 'GTY'];
export const POSITIONS = [
  'Admin Sistem',
  'Kepala Sekolah', 
  'Wakil Kepala Sekolah',
  'Guru Mapel', 
  'Proktor Sesi',
  'Pengawas Ruang',
  'Wali Kelas'
];

export const ROMBELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const STUDENT_STATUSES = ['Aktif', 'Tidak Aktif', 'Pindah', 'Lulus'];

export const EXAM_TYPES = ['PH', 'PTS', 'PAS', 'PAT', 'Try Out', 'Ujian Sekolah', 'Remedial', 'Pengayaan'];

export const getClassesByJenjang = (jenjang: string) => {
  switch (jenjang) {
    case 'SD/MI': return ['1', '2', '3', '4', '5', '6'];
    case 'SMP/MTs': return ['7', '8', '9'];
    case 'SMA/SMK/MA': return ['10', '11', '12'];
    default: return ['7', '8', '9'];
  }
};