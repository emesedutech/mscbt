
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  Search, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  Library,
  Save,
  X,
  PlusCircle,
  Database
} from 'lucide-react';
import { supabase } from '../lib/supabase.ts';
import { GlobalQuestionBank, GlobalQuestion } from '../types.ts';
import QuestionForm from './QuestionForm.tsx';

const GlobalBankManagement: React.FC = () => {
  const [banks, setBanks] = useState<GlobalQuestionBank[]>([]);
  const [questions, setQuestions] = useState<GlobalQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [activeBank, setActiveBank] = useState<GlobalQuestionBank | null>(null);
  const [isEditingBank, setIsEditingBank] = useState<Partial<GlobalQuestionBank> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: bData } = await supabase.from('global_question_banks').select('*').order('created_at', { ascending: false });
    if (bData) setBanks(bData as GlobalQuestionBank[]);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchQuestions = async (bankId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from('global_questions').select('*').eq('global_bank_id', bankId).order('id', { ascending: true });
    if (data) setQuestions(data as GlobalQuestion[]);
    setIsLoading(false);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingBank) return;
    setIsLoading(true);
    
    const payload = {
      ...isEditingBank,
      id: isEditingBank.id || `gl_bank_${Date.now()}`,
      question_count: isEditingBank.question_count || 0,
      author: 'SuperAdmin',
      created_at: new Date().toISOString()
    };

    if (isEditingBank.id) {
       await supabase.from('global_question_banks').update(payload).eq('id', isEditingBank.id);
    } else {
       await supabase.from('global_question_banks').insert(payload);
    }
    
    setIsEditingBank(null);
    fetchData();
  };

  const handleSaveQuestion = async (q: any, reset: boolean) => {
    if (!activeBank) return;
    setIsLoading(true);
    
    const { id, school_id, bank_id, ...rest } = q;
    const payload = {
      ...rest,
      id: id || `gl_q_${Date.now()}`,
      global_bank_id: activeBank.id
    };

    const { error } = await supabase.from('global_questions').upsert(payload, { onConflict: 'id' });
    
    if (!error) {
       // Update counter
       const count = questions.length + (id ? 0 : 1);
       await supabase.from('global_question_banks').update({ question_count: count }).eq('id', activeBank.id);
       if (reset) {
          setEditingQuestion(null);
          fetchQuestions(activeBank.id);
       } else {
          setEditingQuestion(null);
          fetchQuestions(activeBank.id);
       }
    }
    setIsLoading(false);
  };

  const handleDeleteBank = async (bank: GlobalQuestionBank) => {
    if (!window.confirm("HAPUS TOTAL Bank Soal Global ini beserta isinya?")) return;
    await supabase.from('global_question_banks').delete().eq('id', bank.id);
    fetchData();
  };

  const filteredBanks = useMemo(() => banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.subject.toLowerCase().includes(search.toLowerCase())), [banks, search]);

  if (editingQuestion && activeBank) {
    return (
       <QuestionForm 
         initialData={editingQuestion} 
         bankContext={{ id: activeBank.id, subject: activeBank.subject, level: activeBank.level, school_id: 'SYSTEM', is_active: true, question_count: activeBank.question_count }}
         onSave={handleSaveQuestion}
         onCancel={() => setEditingQuestion(null)}
       />
    );
  }

  if (activeBank) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b pb-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setActiveBank(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ArrowLeft size={24}/></button>
              <div>
                 <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{activeBank.name}</h2>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Library Editor Pusat</p>
              </div>
           </div>
           <button onClick={() => setEditingQuestion({})} className="gov-btn gov-btn-primary"><PlusCircle size={18}/> TAMBAH BUTIR GLOBAL</button>
        </div>

        <div className="gov-table-container">
           <table className="gov-table">
              <thead>
                 <tr>
                    <th className="w-16 text-center">No</th>
                    <th>Ringkasan Soal</th>
                    <th className="text-center">Tipe</th>
                    <th className="text-right">Aksi</th>
                 </tr>
              </thead>
              <tbody>
                 {questions.map((q, i) => (
                   <tr key={q.id}>
                      <td className="text-center font-bold text-gray-400">{i+1}</td>
                      <td><div className="text-xs text-gray-700 truncate max-w-xl" dangerouslySetInnerHTML={{ __html: q.question_text }}></div></td>
                      <td className="text-center"><span className="text-[9px] font-black uppercase text-blue-700">{q.type.replace(/_/g,' ')}</span></td>
                      <td className="text-right">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingQuestion(q)} className="p-2 hover:bg-emerald-50 text-emerald-600"><Edit2 size={14}/></button>
                            <button className="p-2 hover:bg-red-50 text-red-600"><Trash2 size={14}/></button>
                         </div>
                      </td>
                   </tr>
                 ))}
                 {questions.length === 0 && (
                   <tr><td colSpan={4} className="py-20 text-center italic text-gray-400">Belum ada soal dalam paket ini.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
             <Globe className="text-emerald-700" size={32} /> Library Soal Global (Emes-Library)
          </h1>
          <button onClick={() => setIsEditingBank({ name: '', subject: 'Matematika', level: '7', description: '' })} className="gov-btn gov-btn-primary">
             <Plus size={18} /> Buat Paket Library Baru
          </button>
       </div>

       <div className="gov-card p-4">
          <div className="relative max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari di Library Pusat..." className="gov-input w-full pl-10" />
          </div>
       </div>

       {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanks.map(bank => (
              <div key={bank.id} className="gov-card p-6 flex flex-col group border-2 hover:border-emerald-600 transition-all">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-sm group-hover:bg-emerald-700 group-hover:text-white transition-colors"><Library size={24}/></div>
                    <span className="bg-gray-900 text-white px-2 py-0.5 rounded-sm text-[8px] font-black uppercase">{bank.level}</span>
                 </div>
                 <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-2">{bank.name}</h3>
                 <p className="text-[10px] text-emerald-700 font-bold uppercase mb-4">{bank.subject}</p>
                 <p className="text-xs text-gray-500 italic flex-1 border-t pt-4">{bank.description}</p>
                 <div className="mt-6 flex justify-between items-center border-t pt-4">
                    <div className="flex items-center gap-2">
                       <Database size={12} className="text-gray-400" />
                       <span className="text-[10px] font-black text-gray-800">{bank.question_count} SOAL</span>
                    </div>
                    <div className="flex gap-1">
                       <button onClick={() => { setActiveBank(bank); fetchQuestions(bank.id); }} className="p-2 hover:bg-emerald-50 text-emerald-700" title="Buka Konten"><ChevronRight size={18}/></button>
                       <button onClick={() => setIsEditingBank(bank)} className="p-2 hover:bg-blue-50 text-blue-600" title="Edit Metadata"><Edit2 size={16}/></button>
                       <button onClick={() => handleDeleteBank(bank)} className="p-2 hover:bg-red-50 text-red-600" title="Hapus"><Trash2 size={16}/></button>
                    </div>
                 </div>
              </div>
            ))}
         </div>
       )}

       {isEditingBank && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg border border-gray-400 animate-in zoom-in duration-200">
               <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase text-gray-800">Metadata Paket Library</h3>
                  <button onClick={() => setIsEditingBank(null)}><X size={24} className="text-gray-400"/></button>
               </div>
               <form onSubmit={handleSaveBank} className="p-8 space-y-5">
                  <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Judul Paket</label><input required value={isEditingBank.name} onChange={e => setIsEditingBank({...isEditingBank, name: e.target.value})} className="gov-input font-bold" /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Mata Pelajaran</label><input required value={isEditingBank.subject} onChange={e => setIsEditingBank({...isEditingBank, subject: e.target.value})} className="gov-input font-bold" /></div>
                     <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Tingkat</label><input required value={isEditingBank.level} onChange={e => setIsEditingBank({...isEditingBank, level: e.target.value})} className="gov-input font-bold" /></div>
                  </div>
                  <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Deskripsi</label><textarea required value={isEditingBank.description} onChange={e => setIsEditingBank({...isEditingBank, description: e.target.value})} className="gov-input h-24" /></div>
                  <div className="pt-6 border-t flex justify-end gap-3"><button type="button" onClick={() => setIsEditingBank(null)} className="gov-btn gov-btn-secondary">BATAL</button><button type="submit" className="gov-btn gov-btn-primary px-10"><Save size={16}/> SIMPAN</button></div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default GlobalBankManagement;
