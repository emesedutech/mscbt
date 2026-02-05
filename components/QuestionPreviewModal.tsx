import React, { useMemo } from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Question } from '../types.ts';

interface QuestionPreviewModalProps {
  question: Question;
  onClose: () => void;
}

const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({ question, onClose }) => {
  
  const validOptions = useMemo(() => {
    return (question.options || []).filter(opt => opt.text && opt.text.trim().length > 0);
  }, [question.options]);

  const validStatements = useMemo(() => {
    return (question.statements || []).filter(s => s.text && s.text.trim().length > 0);
  }, [question.statements]);

  const validPairs = useMemo(() => {
    return (question.matching_pairs || []).filter(p => p.left_text?.trim() && p.right_text?.trim());
  }, [question.matching_pairs]);

  const getLabel = (index: number) => String.fromCharCode(65 + index);

  const renderOptions = () => {
    switch (question.type) {
      case 'pilihan_ganda':
      case 'pilihan_ganda_kompleks':
        if (validOptions.length === 0) return <EmptyDataAlert message="Soal ini belum memiliki opsi jawaban." />;
        return (
          <div className="space-y-3 mt-6">
            {validOptions.map((opt, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors">
                <div className="shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                  {getLabel(idx)}
                </div>
                <div 
                  className="text-xs text-gray-700 leading-relaxed variant-option editor-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.text) }}
                />
              </div>
            ))}
          </div>
        );

      case 'benar_salah':
        if (validStatements.length === 0) return <EmptyDataAlert message="Soal ini belum memiliki daftar pernyataan." />;
        return (
          <div className="mt-6 border border-gray-300 rounded-sm overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 font-bold text-gray-600 border-r border-gray-300 uppercase tracking-tighter">Butir Pernyataan</th>
                  <th className="px-4 py-2 font-bold text-gray-600 text-center w-24 border-r border-gray-300 uppercase tracking-tighter">Benar</th>
                  <th className="px-4 py-2 font-bold text-gray-600 text-center w-24 uppercase tracking-tighter">Salah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {validStatements.map((s, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 border-r border-gray-300 bg-white">
                      <div className="variant-option editor-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(s.text) }} />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-300 text-center bg-gray-50/30">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center bg-gray-50/30">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'menjodohkan':
        if (validPairs.length === 0) return <EmptyDataAlert message="Soal ini belum memiliki pasangan item." />;
        return (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b pb-1">Kolom A</p>
                {validPairs.map((p, idx) => (
                  <div key={idx} className="p-3 border border-gray-200 rounded-sm bg-gray-50 text-xs shadow-sm">
                    {idx + 1}. {p.left_text}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-b pb-1">Kolom B</p>
                {validPairs.map((p, idx) => (
                  <div key={`ans-${idx}`} className="p-3 border border-gray-200 rounded-sm bg-white text-xs font-bold text-gray-700 shadow-sm">
                    {p.right_text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-[1px]">
      <div className="bg-white border border-gray-400 rounded-sm shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200 overflow-hidden">
        <div className="bg-gray-100 border-b border-gray-300 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white border border-gray-300 rounded-sm shadow-sm">
              <Info size={16} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">Emes CBT - Pratinjau Soal</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Antarmuka Peserta Didik (Objektif)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors rounded-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin bg-[#fcfcfc]">
          <div className="max-w-2xl mx-auto flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
               <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 bg-gray-900 text-white text-[9px] font-black rounded-sm uppercase">Tipe: {question.type.replace(/_/g, ' ')}</span>
               </div>
               <div className="text-[9px] font-bold text-gray-400 uppercase">Kesulitan: {question.difficulty}</div>
            </div>

            <div className="space-y-6">
              <div 
                className="text-sm text-gray-900 leading-relaxed variant-question editor-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.question_text) }}
              />
              {renderOptions()}
            </div>
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

const EmptyDataAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-sm flex flex-col items-center text-center gap-3">
    <AlertTriangle size={32} className="text-red-400 opacity-50" />
    <p className="text-xs font-bold text-red-800 uppercase tracking-tight">{message}</p>
    <p className="text-[9px] text-red-500 font-medium italic">Silakan isi konten soal pada editor terlebih dahulu.</p>
  </div>
);

export default QuestionPreviewModal;