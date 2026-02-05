
import { SchoolProfile, ExamSession, Student, ExamSchedule } from '../types.ts';

export type PrintDocType = 'KARTU' | 'BERITA_ACARA' | 'DAFTAR_HADIR' | 'ANALISIS_BUTIR' | 'LEGER_NILAI';

export interface PrintBaseProps {
  school: SchoolProfile | null;
  session?: ExamSession;
  schedule?: ExamSchedule;
  students?: Student[];
  selectedRoomId?: string;
  onDone?: () => void;
}

export interface PrintDateParts {
  full: string;
  hari: string;
  tanggal: string;
  bulan: string;
  tahun: string;
}

export const getIndoDateParts = (dateStr?: string): PrintDateParts => {
  if (!dateStr) return { full: '..........', hari: '..........', tanggal: '..........', bulan: '..........', tahun: '..........' };
  const date = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  return {
    full: `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`,
    hari: days[date.getDay()],
    tanggal: date.getDate().toString(),
    bulan: months[date.getMonth()],
    tahun: date.getFullYear().toString()
  };
};
