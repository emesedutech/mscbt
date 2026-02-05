import React, { useState, useMemo } from 'react';
import { X, Save, FilePlus2, Info, BookOpen, Layers, AlertCircle } from 'lucide-react';
import { SubjectMaster, GradeLevel, QuestionBank } from '../types';

interface QuestionBankFormProps {
  subjects: SubjectMaster[];
  gradeLevels: GradeLevel[];
  existingBanks: QuestionBank[];
  onSave: (data: { subject: string; level: string; description: string }) => void;
  onCancel: () => void;
}

const QuestionBankForm: React.FC<QuestionBankFormProps> = ({ 
  subjects, 
  gradeLevels, 
  existingBanks,
  onSave, 
  onCancel 
}) => {
  const [subjectId, setSubjectId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subjectId || !levelId) {
      setError("Mata Pelajaran dan Tingkat Kelas wajib dipilih.");
      return;
    }

    const selectedSubject = subjects.find(s => s.id === subjectId);
    const selectedLevel = gradeLevels.find(l => l.id === levelId);

    if (!selectedSubject || !selectedLevel) {
      setError("Data referensi tidak valid.");
      return;
    }

    // Validasi Duplikasi: Tidak boleh ada bank soal dengan Mapel + Kelas yang sama
    const isDuplicate = existingBanks.some(
      b => b.subject === selectedSubject.nama && b.level === selectedLevel.nama
    );

    if (isDuplicate) {
      setError(`Bank Soal untuk ${selectedSubject.nama} Kelas ${selectedLevel.nama} sudah tersedia.`);
      return;
    }

    onSave({ 
      subject: selectedSubject.nama, 
      level: selectedLevel.nama, 
      description: description.trim() 
    });
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden border border-gray-300 animate-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-sm shadow-sm">
              <FilePlus2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Definisi Bank Soal Baru</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Parameter Akademik Terstruktur</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-sm flex items-center gap-3 text-red-700 animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-[10px] font-bold uppercase leading-tight">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                <BookOpen size={12} className="text-emerald-600" /> Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={subjectId}
                onChange={(e) => { setSubjectId(e.target.value); setError(null); }}
                className="gov-input font-bold text-xs cursor-pointer"
              >
                <option value="">-- PILIH MATA PELAJARAN --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.kode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                <Layers size={12} className="text-emerald-600" /> Tingkat Kelas / Level <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={levelId}
                onChange={(e) => { setLevelId(e.target.value); setError(null); }}
                className="gov-input font-bold text-xs cursor-pointer"
              >
                <option value="">-- PILIH TINGKAT KELAS --</option>
                {gradeLevels.map(l => (
                  <option key={l.id} value={l.id}>KELAS {l.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">
              Deskripsi / Catatan (Opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="gov-input text-xs font-medium resize-none"
              placeholder="Contoh: Bank Soal Semester Ganjil TA 2024/2025"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 p-3 rounded-sm flex gap-3">
            <Info size={16} className="text-blue-500 shrink-0" />
            <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed tracking-tight italic">
              Nama dan Kode Bank akan dihasilkan secara otomatis oleh sistem untuk memastikan integritas data akademik.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="gov-btn gov-btn-secondary flex-1"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="gov-btn gov-btn-primary flex-[2]"
            >
              <Save size={14} /> Simpan & Generate Bank
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionBankForm;
