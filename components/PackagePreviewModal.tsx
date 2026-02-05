import React from 'react';
import { X, ShieldCheck, Clock, BookOpen, Layers } from 'lucide-react';
import DOMPurify from 'dompurify';
import { ExamSchedule, Question } from '../types.ts';

interface PackagePreviewModalProps {
  pkg: ExamSchedule;
  questions: Question[];
  onClose: () => void;
}

const PackagePreviewModal: React.FC<PackagePreviewModalProps> = ({ pkg, questions, onClose }) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-gray-400 animate-in zoom-in duration-200 overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <ShieldCheck size={24} className="text-emerald-400" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Emes Integrity Preview</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Validasi Struktur Paket Ujian</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 text-gray-400 hover:text-white transition-colors rounded-sm">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin bg-[#fcfcfc]">
          <div className="grid grid-cols-4 gap-4">
             <div className="p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
                <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Mata Pelajaran</span>
                <p className="text-xs font-black uppercase text-emerald-800">{pkg.subject}</p>
             </div>
             <div className="p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
                <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Tingkat / Kelas</span>
                <p className="text-xs font-black uppercase text-emerald-800">KELAS {pkg.level}</p>
             </div>
             <div className="p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
                <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Total Butir</span>
                <p className="text-xs font-black uppercase text-emerald-800">{pkg.question_count} SOAL</p>
             </div>
             <div className="p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
                <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Durasi Kerja</span>
                <p className="text-xs font-black uppercase text-emerald-800">{pkg.duration} MENIT</p>
             </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Struktur Butir Soal</h4>
            {questions.map((q, i) => (
              <div key={q.id} className="p-6 bg-white border border-gray-200 rounded-sm shadow-sm space-y-4">
                 <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[8px] font-black uppercase rounded-sm">BUTIR #{i+1} • {q.type.replace(/_/g,' ')}</span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Bobot: {q.weight}</span>
                 </div>
                 <div className="text-sm text-gray-800 leading-relaxed editor-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.question_text) }} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-300 px-6 py-4 flex justify-end shrink-0">
          <button onClick={onClose} className="px-10 py-2.5 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-sm shadow-md">
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackagePreviewModal;