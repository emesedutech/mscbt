
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  DownloadCloud, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Info,
  ShieldCheck,
  Filter,
  Zap,
  Library
} from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import { GlobalQuestionBank, GlobalQuestion, SubjectMaster, GradeLevel } from '../types.ts';
import { useToast } from '../hooks/useToast.ts';

interface GlobalBankBrowserProps {
  schoolId: string;
  subjects: SubjectMaster[];
  gradeLevels: GradeLevel[];
  onImportComplete: () => void;
}

const GlobalBankBrowser: React.FC<GlobalBankBrowserProps> = ({ schoolId, subjects, gradeLevels, onImportComplete }) => {
  const [globalBanks, setGlobalBanks] = useState<GlobalQuestionBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<GlobalQuestionBank | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<GlobalQuestion[]>([]);
  const toast = useToast();

  const fetchGlobalBanks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('global_question_banks')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setGlobalBanks(data as GlobalQuestionBank[]);
    if (error) toast.error(`Gagal memuat library: ${error.message}`);
    setIsLoading(false);
  };

  useEffect(() => { fetchGlobalBanks(); }, []);

  const filteredBanks = useMemo(() => {
    return globalBanks.filter(b => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase());
      const matchSubject = filterSubject === '' || b.subject === filterSubject;
      const matchLevel = filterLevel === '' || b.level === filterLevel;
      return matchSearch && matchSubject && matchLevel;
    });
  }, [globalBanks, search, filterSubject, filterLevel]);

  const handlePreview = async (bank: GlobalQuestionBank) => {
    setIsLoading(true);
    const { data } = await supabase.from('global_questions').select('*').eq('global_bank_id', bank.id).limit(10);
    if (data) setPreviewQuestions(data as GlobalQuestion[]);
    setSelectedBank(bank);
    setIsLoading(false);
  };

  const handleImport = async (bank: GlobalQuestionBank) => {
    if (!window.confirm(`Gunakan paket "${bank.name}" ke Bank Soal Lokal Anda?`)) return;
    
    setImportingId(bank.id);
    try {
      const { data: localBank, error: bankErr } = await supabase.from('question_banks').insert({
        school_id: schoolId,
        subject: bank.subject,
        level: bank.level,
        is_active: true,
        description: `Imported from Center: ${bank.name}`
      }).select().single();
      if (bankErr) throw bankErr;

      const { data: globalQs, error: qsErr } = await supabase.from('global_questions').select('*').eq('global_bank_id', bank.id);
      if (qsErr) throw qsErr;

      if (globalQs && globalQs.length > 0) {
        const localQs = globalQs.map(q => {
          const { id, global_bank_id, ...rest } = q;
          return {
            ...rest,
            id: `soal_gl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            school_id: schoolId,
            bank_id: localBank.id,
            updated_at: new Date().toISOString()
          };
        });
        const { error: insertErr } = await supabase.from('questions').insert(localQs);
        if (insertErr) throw insertErr;
      }
      toast.success("Bank Soal berhasil di-clone.");
      onImportComplete();
    } catch (err: any) {
      toast.error(`Gagal Import: ${err.message}`);
    } finally {
      setImportingId(null);
    }
  };

  if (selectedBank) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b pb-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setSelectedBank(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ArrowLeft size={24}/></button>
              <div>
                 <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{selectedBank.name}</h2>
                 <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">Preview Konten Pusat</p>
              </div>
           </div>
           <button 
             onClick={() => handleImport(selectedBank)}
             disabled={importingId === selectedBank.id}
             className="gov-btn gov-btn-primary px-8"
           >
             {importingId === selectedBank.id ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
             GUNAKAN PAKET INI
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sampel Butir Soal (10 Soal Pertama)</h3>
              {previewQuestions.map((q, i) => (
                <div key={i} className="gov-card p-6 space-y-4">
                   <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Butir #{i+1} • {q.type.replace(/_/g,' ')}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-sm">{q.difficulty}</span>
                   </div>
                   <div className="text-sm text-gray-700 leading-relaxed editor-content" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                </div>
              ))}
           </div>
           <div className="space-y-6">
              <div className="gov-card p-6 space-y-4 bg-emerald-50/30 border-emerald-200">
                 <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Metadata Paket</h3>
                 <div className="space-y-3">
                    <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Subjek</span><p className="text-xs font-black uppercase text-emerald-900">{selectedBank.subject}</p></div>
                    <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Level</span><p className="text-xs font-black uppercase text-emerald-900">KELAS {selectedBank.level}</p></div>
                    <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Total Soal Tersedia</span><p className="text-xs font-black uppercase text-emerald-900">{selectedBank.question_count} Butir</p></div>
                    <div><span className="text-[9px] font-bold text-gray-400 uppercase block">Deskripsi</span><p className="text-xs font-medium text-gray-600 italic">{selectedBank.description}</p></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
               <Globe className="text-emerald-600" size={28} /> Bank Soal Pusat
            </h2>
            <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mt-1">Gunakan ribuan soal standar nasional siap pakai.</p>
         </div>
         <div className="bg-blue-50 border border-blue-100 p-3 rounded-sm flex items-center gap-3 max-w-md">
            <Info size={16} className="text-blue-500 shrink-0" />
            <p className="text-[9px] text-blue-700 font-bold uppercase leading-tight italic">Seluruh soal di library ini telah melalui proses kurasi ketat untuk memenuhi standar HOTS.</p>
         </div>
      </div>

      <div className="gov-card p-4 flex flex-wrap items-center gap-4 shadow-sm border-gray-200">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Judul Paket atau Mata Pelajaran..." 
            className="gov-input w-full pl-10 text-[10px] font-black uppercase" 
          />
        </div>
        <div className="flex items-center gap-2">
           <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="gov-input text-[10px] font-black uppercase w-48">
              <option value="">Semua Mapel</option>
              {subjects.map(s => <option key={s.id} value={s.nama}>{s.nama}</option>)}
           </select>
           <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="gov-input text-[10px] font-black uppercase w-32">
              <option value="">Semua Kelas</option>
              {gradeLevels.map(l => <option key={l.id} value={l.nama}>{l.nama}</option>)}
           </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 size={40} className="animate-spin text-emerald-600 opacity-20" />
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Menghubungkan ke Library Pusat...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredBanks.map((bank) => (
             <div key={bank.id} className="gov-card group hover:border-emerald-500 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border-2">
                <div className="p-6 flex-1 space-y-4">
                   <div className="flex justify-between items-start">
                      <div className="p-3 bg-emerald-50 text-emerald-700 rounded-sm group-hover:bg-emerald-700 group-hover:text-white transition-colors"><Library size={24}/></div>
                      <span className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black rounded-sm uppercase tracking-tighter shadow-sm">{bank.level}</span>
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">{bank.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{bank.subject}</p>
                   </div>
                   <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed border-t pt-4 border-gray-100">{bank.description}</p>
                   <div className="pt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                         <Zap size={12} strokeWidth={3} />
                         <span className="text-[10px] font-black uppercase">{bank.question_count} Butir Soal</span>
                      </div>
                   </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                   <button onClick={() => handlePreview(bank)} className="flex-1 py-2 bg-white text-gray-600 border border-gray-300 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-gray-100">Pratinjau</button>
                   <button 
                     onClick={() => handleImport(bank)} 
                     disabled={importingId === bank.id}
                     className="flex-1 py-2 bg-emerald-700 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 shadow-md flex items-center justify-center gap-2"
                   >
                     {importingId === bank.id ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14}/>} Import
                   </button>
                </div>
             </div>
           ))}
           {filteredBanks.length === 0 && (
             <div className="col-span-full py-20 text-center">
                <Globe size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Maaf, paket soal yang Anda cari belum tersedia.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default GlobalBankBrowser;
