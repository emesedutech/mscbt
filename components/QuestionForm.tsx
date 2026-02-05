import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  HelpCircle,
  Hash,
  ListFilter,
  Layers,
  Zap,
  Check,
  Type,
  Info,
  ChevronRight,
  X,
  PlusCircle
} from 'lucide-react';
import { Question, QuestionType, QuestionBank } from '../types.ts';
import RichTextEditor from './RichTextEditor.tsx';

interface QuestionFormProps {
  initialData?: Question;
  bankContext: QuestionBank;
  onSave: (data: Question, reset: boolean) => void;
  onCancel: () => void;
}

// Menghapus Isian Singkat & Uraian
const QUESTION_TYPES = [
  { id: 'pilihan_ganda', label: 'Pilihan Ganda' },
  { id: 'pilihan_ganda_kompleks', label: 'PG Kompleks' },
  { id: 'benar_salah', label: 'Benar / Salah' },
  { id: 'menjodohkan', label: 'Menjodohkan' }
];

const QuestionForm: React.FC<QuestionFormProps> = ({ initialData, bankContext, onSave, onCancel }) => {
  if (!bankContext?.id) return null;

  const [activeType, setActiveType] = useState<QuestionType>(initialData?.type || 'pilihan_ganda');
  const [questionHtml, setQuestionHtml] = useState(initialData?.question_text || '');
  const [discussionHtml, setDiscussionHtml] = useState(initialData?.discussion || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>(initialData?.difficulty || 'Sedang');
  const [weight, setWeight] = useState(initialData?.weight || 1);

  const [pgOptions, setPgOptions] = useState(initialData?.options || [
    { label: 'A', text: '', is_correct: true },
    { label: 'B', text: '', is_correct: false },
    { label: 'C', text: '', is_correct: false },
    { label: 'D', text: '', is_correct: false },
    { label: 'E', text: '', is_correct: false }
  ]);

  const [tfStatements, setTfStatements] = useState(initialData?.statements || [
    { id: 'tf1', text: '', is_true: true },
    { id: 'tf2', text: '', is_true: false }
  ]);

  const [matchPairs, setMatchPairs] = useState(initialData?.matching_pairs || [
    { id: 'm1', left_text: '', right_text: '' },
    { id: 'm2', left_text: '', right_text: '' }
  ]);

  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!questionHtml.replace(/<[^>]*>/g, '').trim()) return "Teks pertanyaan wajib diisi.";
    if (activeType === 'pilihan_ganda' || activeType === 'pilihan_ganda_kompleks') {
      if (pgOptions.some(o => !o.text.replace(/<[^>]*>/g, '').trim())) return "Semua teks opsi wajib diisi.";
      if (activeType === 'pilihan_ganda_kompleks' && pgOptions.filter(o => o.is_correct).length < 2) return "PG Kompleks: Minimal 2 kunci jawaban.";
    }
    if (activeType === 'benar_salah') {
      if (tfStatements.some(s => !s.text.replace(/<[^>]*>/g, '').trim())) return "Semua teks pernyataan wajib diisi.";
    }
    if (activeType === 'menjodohkan') {
      if (matchPairs.some(p => !p.left_text.trim() || !p.right_text.trim())) return "Semua pasangan kiri-kanan wajib diisi.";
    }
    return null;
  };

  const handleFinalSave = (reset: boolean) => {
    const err = validate();
    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload: Question = {
      id: initialData?.id || `soal_${Date.now()}`,
      school_id: bankContext.school_id,
      bank_id: bankContext.id,
      type: activeType,
      subject: bankContext.subject,
      levels: [bankContext.level],
      category,
      difficulty,
      question_text: questionHtml,
      options: ['pilihan_ganda', 'pilihan_ganda_kompleks'].includes(activeType) ? pgOptions : undefined,
      statements: activeType === 'benar_salah' ? tfStatements : undefined,
      matching_pairs: activeType === 'menjodohkan' ? matchPairs : undefined,
      correct_answers: undefined,
      weight,
      discussion: discussionHtml,
      updated_at: new Date().toISOString()
    };

    onSave(payload, reset);
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f4f4] border border-gray-300 rounded-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 border border-gray-200 rounded-sm transition-colors text-gray-600"><ArrowLeft size={18}/></button>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Editor Butir Soal</h2>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-sm text-[10px] font-bold text-emerald-800 uppercase">
            <span>{bankContext.subject}</span>
            <ChevronRight size={12} />
            <span>KELAS {bankContext.level}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleFinalSave(true)}
            className="px-4 py-1.5 bg-white border border-gray-300 rounded-sm font-black text-gray-700 text-[10px] uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2"
          >
            <PlusCircle size={14} /> Simpan & Buat Baru
          </button>
          <button 
            onClick={() => handleFinalSave(false)}
            className="px-6 py-1.5 bg-emerald-700 text-white rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800 flex items-center gap-2 shadow-sm"
          >
            <Save size={14} /> Simpan & Tutup
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-sm flex items-center gap-3 text-sm font-bold animate-shake">
              <AlertCircle size={20} /> <p>{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-1"><X size={16}/></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Pertanyaan */}
              <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Teks Pertanyaan (Objektif)</h3>
                <RichTextEditor value={questionHtml} onChange={setQuestionHtml} schoolId={bankContext.school_id} />
              </div>

              {/* Jawaban Sesuai Tipe Soal */}
              <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Opsi & Kunci Jawaban</h3>
                
                {/* PILIHAN GANDA & PG KOMPLEKS */}
                {(activeType === 'pilihan_ganda' || activeType === 'pilihan_ganda_kompleks') && (
                  <div className="space-y-4">
                    {pgOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (activeType === 'pilihan_ganda') {
                              setPgOptions(pgOptions.map(o => ({ ...o, is_correct: o.label === opt.label })));
                            } else {
                              setPgOptions(pgOptions.map(o => o.label === opt.label ? { ...o, is_correct: !o.is_correct } : o));
                            }
                          }}
                          className={`shrink-0 w-8 h-8 rounded-sm mt-1 flex items-center justify-center font-bold text-sm border-2 ${opt.is_correct ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                        >
                          {opt.label}
                        </button>
                        <div className="flex-1">
                          <RichTextEditor
                            variant="option"
                            value={opt.text}
                            onChange={(val) => setPgOptions(pgOptions.map(o => o.label === opt.label ? { ...o, text: val } : o))}
                            minHeight="40px"
                            schoolId={bankContext.school_id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* BENAR SALAH */}
                {activeType === 'benar_salah' && (
                  <div className="space-y-6">
                    {tfStatements.map((s, idx) => (
                      <div key={s.id} className="p-4 border border-gray-100 rounded-sm bg-gray-50/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Pernyataan #{idx+1}</span>
                          <div className="flex gap-2">
                             <button type="button" onClick={() => setTfStatements(tfStatements.map(x => x.id === s.id ? {...x, is_true: true} : x))} className={`px-4 py-1 text-[10px] font-black rounded-sm border ${s.is_true ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-400 border-gray-200'}`}>BENAR</button>
                             <button type="button" onClick={() => setTfStatements(tfStatements.map(x => x.id === s.id ? {...x, is_true: false} : x))} className={`px-4 py-1 text-[10px] font-black rounded-sm border ${!s.is_true ? 'bg-red-600 text-white border-red-700' : 'bg-white text-gray-400 border-gray-200'}`}>SALAH</button>
                          </div>
                        </div>
                        <RichTextEditor variant="option" value={s.text} onChange={(val) => setTfStatements(tfStatements.map(x => x.id === s.id ? {...x, text: val} : x))} minHeight="60px" schoolId={bankContext.school_id} />
                      </div>
                    ))}
                  </div>
                )}

                {/* MENJODOHKAN */}
                {activeType === 'menjodohkan' && (
                  <div className="space-y-4">
                     {matchPairs.map((p, idx) => (
                       <div key={p.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-gray-400 uppercase">Baris #{idx+1} Kiri</label>
                             <input value={p.left_text} onChange={e => setMatchPairs(matchPairs.map(x => x.id === p.id ? {...x, left_text: e.target.value} : x))} className="gov-input font-bold" placeholder="Teks Kiri..." />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-gray-400 uppercase">Pasangan Kanan</label>
                             <input value={p.right_text} onChange={e => setMatchPairs(matchPairs.map(x => x.id === p.id ? {...x, right_text: e.target.value} : x))} className="gov-input font-bold" placeholder="Teks Kanan (Kunci)..." />
                          </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Atribut */}
            <div className="space-y-6">
              <div className="gov-card p-6 space-y-5">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b pb-2">Atribut Soal</h3>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2"><Type size={12}/> Tipe Soal</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {QUESTION_TYPES.map(t => (
                      <button key={t.id} type="button" onClick={() => setActiveType(t.id as QuestionType)} className={`py-2 text-[10px] font-black rounded-sm border transition-all ${activeType === t.id ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2"><Layers size={12}/> KD / Topik</label>
                  <input value={category} onChange={e => setCategory(e.target.value)} className="gov-input text-xs" placeholder="Contoh: 3.1 Memahami Konsep..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2"><Zap size={12}/> Kesulitan</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="gov-input text-xs font-bold uppercase">
                      <option>Mudah</option>
                      <option>Sedang</option>
                      <option>Sulit</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2"><Hash size={12}/> Bobot</label>
                    <input type="number" value={weight} onChange={e => setWeight(parseInt(e.target.value) || 0)} className="gov-input font-bold" />
                  </div>
                </div>
              </div>
              <div className="gov-card p-6 space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b pb-2">Pembahasan (Opsional)</h3>
                <RichTextEditor value={discussionHtml} onChange={setDiscussionHtml} minHeight="120px" schoolId={bankContext.school_id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
