import React, { useState, useMemo } from 'react';
import { Save, X, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { ExamSchedule, Question } from '../types.ts';
import { stripHtml } from '../lib/utils.ts';

interface PackageContentManagerProps {
  schedule: ExamSchedule;
  allQuestions: Question[];
  onSave: (questionIds: string[]) => void;
  onCancel: () => void;
}

const PackageContentManager: React.FC<PackageContentManagerProps> = ({ schedule, allQuestions, onSave, onCancel }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(schedule.question_ids || []));
  const [search, setSearch] = useState('');

  const bankQuestions = useMemo(() => {
    return allQuestions.filter(q => q.bank_id === schedule.bank_id);
  }, [allQuestions, schedule.bank_id]);

  const availableQuestions = useMemo(() => {
    return bankQuestions.filter(q => 
      !selectedIds.has(q.id) &&
      stripHtml(q.question_text).toLowerCase().includes(search.toLowerCase())
    );
  }, [bankQuestions, selectedIds, search]);

  const selectedQuestions = useMemo(() => {
    return Array.from(selectedIds).map(id => bankQuestions.find(q => q.id === id)).filter(Boolean) as Question[];
  }, [selectedIds, bankQuestions]);

  const handleAdd = (id: string) => {
    setSelectedIds(prev => new Set(prev).add(id));
  };

  const handleRemove = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selectedIds));
  };
  
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-gray-300 animate-in zoom-in duration-200">
        <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase text-gray-800">Manajer Konten Paket Ujian</h3>
            <p className="text-xs text-gray-500 mt-1">{schedule.name}</p>
          </div>
          <button onClick={onCancel}><X size={24}/></button>
        </div>
        <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-hidden">
          {/* Available Questions */}
          <div className="flex flex-col border border-gray-200 rounded-md">
            <div className="p-4 border-b">
              <h4 className="font-bold text-gray-700">Bank Soal Sumber</h4>
              <div className="relative mt-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari soal..." className="gov-input w-full pl-9 text-sm" />
              </div>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-2 scrollbar-thin">
              {availableQuestions.map(q => (
                <div key={q.id} className="p-3 bg-white border rounded-md flex items-center justify-between">
                  <p className="text-xs text-gray-700 truncate flex-1 pr-4">{stripHtml(q.question_text)}</p>
                  <button onClick={() => handleAdd(q.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full"><ArrowRight size={16}/></button>
                </div>
              ))}
            </div>
          </div>
          {/* Selected Questions */}
          <div className="flex flex-col border border-emerald-300 bg-emerald-50/30 rounded-md">
            <div className="p-4 border-b border-emerald-200">
              <h4 className="font-bold text-emerald-800">Soal Dalam Paket ({selectedIds.size} / {schedule.question_count})</h4>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-2 scrollbar-thin">
              {selectedQuestions.map((q) => (
                <div key={q.id} className="p-3 bg-white border border-emerald-200 rounded-md flex items-center justify-between">
                  <p className="text-xs text-gray-700 truncate flex-1 pr-4">{stripHtml(q.question_text)}</p>
                  <button onClick={() => handleRemove(q.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-full"><X size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onCancel} className="gov-btn gov-btn-secondary">Batal</button>
          <button onClick={handleSave} className="gov-btn gov-btn-primary"><Save size={16}/> Simpan Konten Paket</button>
        </div>
      </div>
    </div>
  );
};

export default PackageContentManager;
