import React, { useState } from 'react';
import { X, GraduationCap, UserCheck, ShieldCheck, ChevronDown, Download, Youtube, BookOpen } from 'lucide-react';

interface AccordionItemProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ icon, title, children, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full flex justify-between items-center text-left p-4 hover:bg-gray-100 focus:outline-none transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
            {icon}
          </div>
          <span className="font-bold text-gray-800 uppercase tracking-tight text-sm">{title}</span>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 bg-white space-y-4 text-xs text-gray-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

interface UserGuideModalProps {
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>('siswa');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-50 rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col border border-gray-300 animate-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-md">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">Panduan Pengguna Emes CBT</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Mulai Cepat & Bantuan Teknis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-sm text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="gov-card m-4">
            <AccordionItem 
              icon={<GraduationCap size={20} />} 
              title="Untuk Siswa"
              isOpen={openAccordion === 'siswa'}
              onClick={() => toggleAccordion('siswa')}
            >
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong>Login:</strong> Masukkan NPSN sekolah, NIS sebagai username, dan password yang diberikan oleh admin.</li>
                <li><strong>Mulai Ujian:</strong> Pilih jadwal ujian yang aktif dan klik tombol "Mulai". Pastikan soal sudah diunduh jika ada tombol "Unduh Soal".</li>
                <li><strong>Menjawab Soal:</strong> Klik pada opsi jawaban yang Anda anggap benar. Untuk soal pilihan ganda kompleks, Anda bisa memilih lebih dari satu jawaban.</li>
                <li><strong>Koneksi Terputus:</strong> Jangan panik! Jawaban Anda tersimpan otomatis di perangkat. Lanjutkan mengerjakan dan sistem akan sinkronisasi saat koneksi pulih.</li>
                <li><strong>Selesai:</strong> Setelah semua soal dijawab, klik tombol "Selesai" di soal terakhir, lalu konfirmasi.</li>
              </ul>
            </AccordionItem>

            <AccordionItem 
              icon={<UserCheck size={20} />} 
              title="Untuk Guru & Proktor"
              isOpen={openAccordion === 'guru'}
              onClick={() => toggleAccordion('guru')}
            >
              <h4 className="font-bold text-gray-800 mb-2">Manajemen Soal</h4>
              <ul className="list-disc list-inside space-y-2 pl-2 mb-4">
                <li><strong>Import Soal:</strong> Di menu "Bank Soal", klik "Import Soal" dan unduh template Excel yang disediakan. Isi sesuai format, lalu unggah kembali.</li>
                <li><strong>Bank Soal:</strong> Kelompokkan soal berdasarkan Mata Pelajaran dan Kelas untuk digunakan dalam berbagai paket ujian.</li>
              </ul>
              <h4 className="font-bold text-gray-800 mb-2">Pelaksanaan Ujian</h4>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong>Mengatur Jadwal:</strong> Buat "Paket Ujian" dari Bank Soal, lalu atur waktu dan ruang di "Jadwal Ujian".</li>
                <li><strong>Monitoring Siswa:</strong> Di menu "Pelaksanaan", pilih sesi yang aktif untuk melihat progres siswa secara real-time, mendeteksi pelanggaran, dan memberikan tambahan waktu.</li>
                <li><strong>Broadcast Pesan:</strong> Kirim pengumuman ke semua peserta yang sedang mengerjakan ujian melalui dashboard monitoring.</li>
              </ul>
               <div className="mt-4 flex flex-wrap gap-4">
                  <button className="gov-btn gov-btn-secondary text-xs"><Download size={14} /> Download Template Excel</button>
                  <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="gov-btn bg-red-50 text-red-700 text-xs"><Youtube size={14} /> Tonton Tutorial Video</a>
               </div>
            </AccordionItem>

            <AccordionItem 
              icon={<ShieldCheck size={20} />} 
              title="Untuk Admin Sekolah"
              isOpen={openAccordion === 'admin'}
              onClick={() => toggleAccordion('admin')}
            >
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong>Konfigurasi Awal:</strong> Lengkapi "Profil Sekolah" dan "Master Data" (Kelas, Mapel, Ruang) sebagai dasar operasional sistem.</li>
                <li><strong>Manajemen Pengguna:</strong> Tambah data guru dan siswa secara manual atau melalui import Excel di menu "Data Pengguna".</li>
                <li><strong>Manajemen Akses:</strong> Tunjuk Guru sebagai "Proktor" atau "Pengawas" di menu "Data Pengguna" > "Akses" untuk memberikan hak khusus saat ujian.</li>
                <li><strong>Export Nilai:</strong> Setelah ujian selesai, buka menu "Laporan", pilih paket ujian, dan Anda dapat mencetak Leger Nilai atau Laporan Analisis Butir Soal.</li>
              </ul>
            </AccordionItem>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end">
          <button onClick={onClose} className="gov-btn gov-btn-primary text-xs">Tutup Panduan</button>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
