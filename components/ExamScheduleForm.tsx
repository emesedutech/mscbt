
import React, { useState, useMemo } from 'react';
import { 
  Save, 
  RefreshCcw,
  Layers,
  ArrowLeft,
  Info,
  Lock,
  BookOpen,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  ExamSchedule, 
  Question,
  QuestionBank
} from '../types.ts';
import { PKT_STATUS_DRAFT, PKT_STATUS_READY } from '../constants.tsx';

interface ExamScheduleFormProps {
  initialData?: ExamSchedule;
  questionBanks: QuestionBank[];
  questions: Question[];
  onSave: (data: ExamSchedule) => void;
  onCancel: () => void;
}

const ExamScheduleForm: React.FC<ExamScheduleFormProps> = ({
  initialData,
  questionBanks,
  questions,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<ExamSchedule>>(initialData || {
    name: '',
    code: '',
    bank_id: '',
    subject: '',
    level: '',
    question_count: 0,
    duration: 90,
    total_weight: 100,
    randomize_questions: true,
    randomize_options: true,
    scoring_mode: 'Standar',
    passing_grade: 75,
    status: PKT_STATUS_DRAFT,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedBank = useMemo(() => 
    questionBanks.find(b => b.id === formData.bank_id),
  [formData.bank_id, questionBanks]);

  const handleBankSelection = (bankId: string) => {
    const bank = questionBanks.find(b => b.id === bankId);
    if (bank) {
      setFormData(prev => ({
        ...prev,
        bank_id: bankId,
        subject: bank.subject,
        level: bank.level,
        question_count: bank.question_count
      }));
    }
  };

  const generateCode = () => {
    const sj = formData.subject ? formData.subject.substring(0,3).toUpperCase() : 'EXAM';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, code: `PKT-${sj}-${rand}` }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.bank_id || !formData.code) {
      setValidationError("Atribut Paket Wajib Diisi: Nama Paket, Kode, dan Bank Soal Referensi harus dilengkapi sebelum menyimpan.");
      return;
    }

    const finalData: ExamSchedule = {
      ...formData as ExamSchedule,
      id: initialData?.id || `pkt_${Date.now()}`
    };
    onSave(finalData);
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* VALIDATION ERROR MODAL */}
      {validationError && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden border border-gray-300 animate-in zoom-in duration-200">
            <div className="h-1.5 w-full bg-red-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-700 mb-4">
                <AlertCircle size={20} />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Kesalahan Validasi</h3>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed italic border-l-2 border-red-100 pl-3">
                {validationError}
              </p>
              <button 
                onClick={() => setValidationError(null)}
                className="mt-6 w-full py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-black transition-all"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-sm text-gray-400"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Definisi Akademik Paket Ujian</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Konfigurasi struktur APA yang akan diujikan</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="gov-card p-8 space-y-8">
          {/* Section 1: Identitas & Sumber */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2 flex items-center gap-2">
              < BookOpen size={14} /> Konten & Identitas Paket
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nama Paket Ujian</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="gov-input font-bold" placeholder="MISAL: ASESMEN SUMATIF MATEMATIKA" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Kode Paket</label>
                <div className="flex gap-2">
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="gov-input flex-1 font-mono font-bold" placeholder="PKT-MTK-01" />
                  <button type="button" onClick={generateCode} className="p-2 bg-gray-100 border border-gray-300 rounded-sm hover:bg-gray-200 transition-colors"><RefreshCcw size={16}/></button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-emerald-700 uppercase mb-2">Pilih Bank Soal Utama</label>
                <select required value={formData.bank_id} onChange={e => handleBankSelection(e.target.value)} className={`gov-input font-black uppercase text-xs ${questionBanks.length === 0 ? 'border-red-300 bg-red-50' : ''}`}>
                  <option value="">-- PILIH WADAH BANK SOAL --</option>
                  {questionBanks.filter(b => b.is_active).map(b => <option key={b.id} value={b.id}>{b.subject} - KELAS {b.level} ({b.question_count} Butir)</option>)}
                </select>
              </div>
            </div>

            {selectedBank && (
              <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={10} className="text-emerald-700" />
                    <span className="text-[8px] font-black text-gray-400 uppercase">Mata Pelajaran</span>
                  </div>
                  <p className="text-xs font-black text-emerald-900 uppercase">{selectedBank.subject}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={10} className="text-emerald-700" />
                    <span className="text-[8px] font-black text-gray-400 uppercase">Tingkat Kelas</span>
                  </div>
                  <p className="text-xs font-black text-emerald-900 uppercase">KELAS {selectedBank.level}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={10} className="text-emerald-700" />
                    <span className="text-[8px] font-black text-gray-400 uppercase">Jumlah Soal</span>
                  </div>
                  <p className="text-xs font-black text-emerald-900 uppercase">{selectedBank.question_count} BUTIR</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Definisi Teknis Akademik */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2 flex items-center gap-2">
              <Layers size={14} /> Aturan Pengerjaan & Penilaian
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Durasi Ujian (Menit)</label>
                <input type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})} className="gov-input font-bold" />
                <p className="text-[9px] text-gray-400 mt-1 italic">*Durasi pengerjaan yang akan diwariskan ke Sesi.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Total Bobot Nilai</label>
                <input type="number" required value={formData.total_weight} onChange={e => setFormData({...formData, total_weight: parseInt(e.target.value) || 100})} className="gov-input font-bold" placeholder="100" />
              </div>
              <div className="space-y-4 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={formData.randomize_questions} onChange={e => setFormData({...formData, randomize_questions: e.target.checked})} className="w-4 h-4 text-emerald-700 border-gray-300 rounded-sm" />
                  <span className="text-xs font-bold text-gray-700 uppercase group-hover:text-emerald-700">Acak Urutan Soal</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={formData.randomize_options} onChange={e => setFormData({...formData, randomize_options: e.target.checked})} className="w-4 h-4 text-emerald-700 border-gray-300 rounded-sm" />
                  <span className="text-xs font-bold text-gray-700 uppercase group-hover:text-emerald-700">Acak Opsi Jawaban</span>
                </label>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Mode Penilaian</label>
                  <select value={formData.scoring_mode} onChange={e => setFormData({...formData, scoring_mode: e.target.value as any})} className="gov-input text-xs font-bold uppercase">
                    <option value="Standar">STANDAR (BENAR POIN PENUH)</option>
                    <option value="Minus">SISTEM MINUS (BENAR +4, SALAH -1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">KKM / Nilai Lulus (%)</label>
                  <input type="number" value={formData.passing_grade} onChange={e => setFormData({...formData, passing_grade: parseInt(e.target.value) || 0})} className="gov-input font-bold" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Status Paket Ujian</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="gov-input font-black uppercase text-[10px] min-w-[180px]">
                <option value={PKT_STATUS_DRAFT}>DRAFT (DALAM PROSES)</option>
                <option value={PKT_STATUS_READY}>SIAP DIGUNAKAN (LOCKED)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onCancel} className="gov-btn gov-btn-secondary text-[10px]">Batalkan</button>
              <button type="submit" className="gov-btn gov-btn-primary text-[10px]"><Save size={14} /> Simpan Definisi Paket</button>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-4 rounded-sm flex items-start gap-4">
          <Info size={20} className="text-orange-600 shrink-0" />
          <p className="text-[10px] text-orange-800 font-bold uppercase leading-relaxed italic">
            PENTING: Paket Ujian adalah definisi akademik (APA). Tanggal, Jam, dan Ruang diatur di menu Jadwal & Sesi Ujian berdasarkan Paket yang berstatus "Siap Digunakan".
          </p>
        </div>
      </form>
    </div>
  );
};

export default ExamScheduleForm;
